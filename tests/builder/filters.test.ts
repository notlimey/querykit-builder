import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { arith, prop } from '../../src/expressions';
import { buildFilters } from '../../src/filters';

test('joins callback fragments in declaration order', () => {
	const query = buildFilters({
		search: (qb) =>
			qb.containsCaseInsensitive(['Title', 'Author.Name'], 'dune'),
		status: (qb) => qb.in('Status', ['Active']),
		active: (qb) => qb.isNull('DeletedAt'),
	});

	expect(query).toBe(
		'(Title, Author.Name) @=* "dune" && Status ^^ ["Active"] && DeletedAt == null',
	);
});

test('drops falsy entries so optional filters read naturally', () => {
	const search = '';
	const status: string[] = [];
	const minAge = 18;

	const query = buildFilters({
		search: search && ((qb) => qb.contains('Title', search)),
		status: status.length && ((qb) => qb.in('Status', status)),
		minAge:
			minAge != null && ((qb) => qb.greaterThanOrEqual('Age', minAge)),
		missing: undefined,
		disabled: false,
		blank: '   ',
	});

	expect(query).toBe('Age >= 18');
});

test('returns an empty string when everything is filtered out', () => {
	expect(buildFilters({ a: null, b: false, c: '' })).toBe('');
	expect(buildFilters([])).toBe('');
	expect(buildFilters({ a: null }, { addFilterStatement: true })).toBe('');
});

test('accepts strings, builders and arrays', () => {
	const builder = new QueryBuilder().equals('Priority', 'High');

	expect(
		buildFilters([
			'Status == "Open"',
			builder,
			(qb) => qb.equals('Team', 'A'),
		]),
	).toBe('Status == "Open" && Priority == "High" && Team == "A"');
});

test('strips a Filters= prefix from incoming fragments', () => {
	const prefixed = new QueryBuilder(false, true).equals('Status', 'Open');

	expect(buildFilters([prefixed, 'Filters= Team == "A"'])).toBe(
		'Status == "Open" && Team == "A"',
	);
});

test('parenthesizes fragments that contain a top-level logical operator', () => {
	const query = buildFilters({
		either: (qb) => qb.equals('A', 1).or().equals('B', 2),
		single: (qb) => qb.equals('C', 3),
	});

	expect(query).toBe('(A == 1 || B == 2) && C == 3');
});

test('leaves an already grouped fragment alone', () => {
	const query = buildFilters({
		grouped: (qb) =>
			qb.openParen().equals('A', 1).or().equals('B', 2).closeParen(),
		single: (qb) => qb.equals('C', 3),
	});

	expect(query).toBe('(A == 1 || B == 2) && C == 3');
});

test('does not wrap a lone fragment', () => {
	expect(
		buildFilters({ only: (qb) => qb.equals('A', 1).or().equals('B', 2) }),
	).toBe('A == 1 || B == 2');
});

test('ignores logical operators inside quoted values', () => {
	const query = buildFilters({
		text: (qb) => qb.equals('Title', 'A && B'),
		other: (qb) => qb.equals('C', 3),
	});

	expect(query).toBe('Title == "A && B" && C == 3');
});

test('honours the join operator', () => {
	const query = buildFilters(
		{ a: (qb) => qb.equals('A', 1), b: (qb) => qb.equals('B', 2) },
		{ join: '||' },
	);

	expect(query).toBe('A == 1 || B == 2');
});

test('supports the Filters= prefix and uri encoding', () => {
	const entries = { a: (qb: QueryBuilder) => qb.equals('A', 1) };

	expect(buildFilters(entries, { addFilterStatement: true })).toBe(
		'Filters= A == 1',
	);
	expect(buildFilters(entries, { encodeUri: true })).toBe('A%20%3D%3D%201');
});

test('accepts a fragment callback that returns its own builder or string', () => {
	const query = buildFilters([
		() => new QueryBuilder().equals('A', 1),
		() => 'B == 2',
	]);

	expect(query).toBe('A == 1 && B == 2');
});

test('works with the newer syntax helpers', () => {
	const query = buildFilters({
		compare: (qb) => qb.notEquals('FirstName', prop('LastName')),
		math: (qb) => qb.greaterThan(arith('Price', '*', 'Quantity'), 1000),
	});

	expect(query).toBe('FirstName != LastName && (Price * Quantity) > 1000');
});
