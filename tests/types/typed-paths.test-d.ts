import { describe, expectTypeOf, test } from 'vitest';
import {
	buildFilters,
	type FilterFragment,
	type Path,
	type PathValue,
	type PropertyPath,
	prop,
	QueryBuilder,
	SortBuilder,
} from '../../src';

interface Club {
	id: string;
	name: string;
}

interface Team {
	name: string;
	club: Club;
	players: Player[];
}

interface Player {
	id: string;
	name: string;
	age: number;
	team?: Team | null;
	tags: string[];
	createdAt: Date;
	meta: unknown;
	onSelect?: () => void;
}

describe('PropertyPath', () => {
	test('defaults to plain string when untyped', () => {
		expectTypeOf<PropertyPath>().toEqualTypeOf<string>();
		expectTypeOf<PropertyPath<unknown>>().toEqualTypeOf<string>();
	});

	test('accepts scalar, nested and collection paths', () => {
		expectTypeOf<'name'>().toExtend<PropertyPath<Player>>();
		expectTypeOf<'team.club.name'>().toExtend<PropertyPath<Player>>();
		// collections contribute themselves (has/count) and element paths
		expectTypeOf<'tags'>().toExtend<PropertyPath<Player>>();
		expectTypeOf<'team.players'>().toExtend<PropertyPath<Player>>();
		expectTypeOf<'team.players.name'>().toExtend<PropertyPath<Player>>();
		// Date is a leaf, unknown is a leaf, functions are excluded
		expectTypeOf<'createdAt'>().toExtend<PropertyPath<Player>>();
		expectTypeOf<'meta'>().toExtend<PropertyPath<Player>>();
	});

	test('rejects typos, over-drilling and array internals', () => {
		expectTypeOf<'nmae'>().not.toExtend<PropertyPath<Player>>();
		expectTypeOf<'team.club.oops'>().not.toExtend<PropertyPath<Player>>();
		expectTypeOf<'tags.length'>().not.toExtend<PropertyPath<Player>>();
		expectTypeOf<'createdAt.getTime'>().not.toExtend<
			PropertyPath<Player>
		>();
		expectTypeOf<'onSelect'>().not.toExtend<PropertyPath<Player>>();
	});

	test('caps recursion on cyclic graphs instead of hanging', () => {
		// default cap is 3 segments; deeper needs an explicit depth
		expectTypeOf<'team.players.name'>().toExtend<PropertyPath<Player>>();
		expectTypeOf<'team.players.team.name'>().not.toExtend<
			PropertyPath<Player>
		>();
		expectTypeOf<'team.players.team.name'>().toExtend<Path<Player, 3>>();
		expectTypeOf<Path<Player, 1>>().not.toExtend<never>();
	});
});

describe('QueryBuilder<T>', () => {
	test('typed builder narrows the property argument', () => {
		const qb = new QueryBuilder<Player>();
		qb.equals('team.club.id', 'x')
			.greaterThan('age', 18)
			.in('tags', ['a'])
			.isNull('team')
			.containsCaseInsensitive(['name', 'team.name'], 'q');

		// @ts-expect-error typo in property path
		qb.equals('team.club.oops', 'x');
		// @ts-expect-error typo in grouped property list
		qb.containsCaseInsensitive(['name', 'nmae'], 'q');
	});

	test('prop() stays the untyped escape hatch for dynamic names', () => {
		const dynamic: string = 'Whatever.Runtime.Decides';
		new QueryBuilder<Player>().equals(prop(dynamic), 'x');
	});

	test('untyped builder still accepts any string', () => {
		new QueryBuilder().equals('Anything.Goes', 1);
	});
});

describe('PathValue and value checking', () => {
	interface Ticket {
		title: string;
		points: number;
		done: boolean;
		status: 'Open' | 'Closed';
		createdAt: Date;
		assignee?: { name: string; level: 1 | 2 | 3 } | null;
		labels: string[];
		meta: unknown;
	}

	test('PathValue resolves nested and collection paths', () => {
		expectTypeOf<PathValue<Ticket, 'points'>>().toEqualTypeOf<number>();
		expectTypeOf<
			PathValue<Ticket, 'assignee.name'>
		>().toEqualTypeOf<string>();
		// arrays resolve to their element type — what has/in compare against
		expectTypeOf<PathValue<Ticket, 'labels'>>().toEqualTypeOf<string>();
		expectTypeOf<PathValue<Ticket, 'nope'>>().toEqualTypeOf<never>();
	});

	test('values must match the type at the path', () => {
		const qb = new QueryBuilder<Ticket>();
		qb.equals('points', 18)
			.equals('title', 'x')
			.equals('done', true)
			.notEquals('assignee.level', 2);

		// @ts-expect-error string value on a number field
		qb.equals('points', 'eighteen');
		// @ts-expect-error number value on a string field
		qb.equals('title', 5);
		// @ts-expect-error string value on a boolean field
		qb.equals('done', 'yes');
		// @ts-expect-error 4 is not one of the literal levels
		qb.equals('assignee.level', 4);
	});

	test('literal unions survive', () => {
		const qb = new QueryBuilder<Ticket>();
		qb.equals('status', 'Open');
		// @ts-expect-error not a member of the status union
		qb.equals('status', 'Archived');
		qb.in('status', ['Open', 'Closed']);
		// @ts-expect-error array element outside the union
		qb.in('status', ['Nope']);
	});

	test('Date fields take ISO strings, has/in take element types', () => {
		const qb = new QueryBuilder<Ticket>();
		qb.greaterThan('createdAt', '2024-01-01');
		// @ts-expect-error a number is not a date input
		qb.greaterThan('createdAt', 5);
		qb.has('labels', 'bug');
		// @ts-expect-error labels are strings
		qb.has('labels', 5);
		qb.in('points', [1, 2]);
	});

	test('escape hatches and loose leaves stay permissive', () => {
		const qb = new QueryBuilder<Ticket>();
		qb.equals('title', prop('assignee.name')); // property-to-property
		qb.equals('meta', 'anything');
		qb.equals('meta', 5);
		qb.equals(['title', 'assignee.name'], 'x'); // group
		// untyped builder: unchanged
		new QueryBuilder().equals('whatever', true);
	});
});

describe('SortBuilder<T> and buildFilters<T>', () => {
	test('typed sort paths', () => {
		new SortBuilder<Player>().asc('team.club.name').desc('age');
		// @ts-expect-error typo in sort property
		new SortBuilder<Player>().asc('aeg');
		// static from() parses untyped input but keeps the type param
		expectTypeOf(SortBuilder.from<Player>('age')).toEqualTypeOf<
			SortBuilder<Player>
		>();
	});

	test('typed filter fragments', () => {
		buildFilters<Player>({
			search: (qb) => qb.containsCaseInsensitive('name', 'q'),
		});
		const fragment: FilterFragment<Player> = (qb) =>
			// @ts-expect-error typo inside a typed fragment
			qb.equals('nmae', 'x');
		void fragment;
	});
});
