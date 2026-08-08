import { expect, test } from 'vitest';
import DefaultExport, {
	arith,
	prop,
	QueryBuilder,
	SortBuilder,
	validateQuery,
} from '../../src/index';

test('exposes the builder as both a named and default export', () => {
	expect(DefaultExport).toBe(QueryBuilder);
	expect(new QueryBuilder(false, false).equals('A', 1).build()).toBe(
		'A == 1',
	);
});

test('exposes the expression helpers and sort builder', () => {
	const query = new QueryBuilder(false, false)
		.containsCaseInsensitive(['Title', 'Author.Name'], 'dune')
		.and()
		.isNull('DeletedAt')
		.and()
		.greaterThanOrEqual(arith('Score', '+', 'Bonus'), 50)
		.and()
		.notEquals('FirstName', prop('LastName'))
		.build();

	expect(query).toBe(
		'(Title, Author.Name) @=* "dune" && DeletedAt == null && (Score + Bonus) >= 50 && FirstName != LastName',
	);
	expect(validateQuery(query)).toEqual({ valid: true });
	expect(new SortBuilder().desc('CreatedAt').asc('Title').build()).toBe(
		'-CreatedAt, Title',
	);
});
