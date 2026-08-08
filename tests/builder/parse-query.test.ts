import { describe, expect, test } from 'vitest';
import {
	arith,
	parseQuery,
	printQuery,
	prop,
	QueryBuilder,
	type QueryExpr,
	QueryOperator,
	tryParseQuery,
	validateQuery,
} from '../../src';

/** parse → print → parse must be a fixed point, and reparse identical. */
function roundTrip(query: string): string {
	const ast = parseQuery(query);
	expect(ast).not.toBeNull();
	const printed = printQuery(ast as QueryExpr);
	expect(parseQuery(printed)).toEqual(ast);
	expect(printQuery(parseQuery(printed) as QueryExpr)).toBe(printed);
	return printed;
}

describe('operator coverage', () => {
	const arrayOperators = new Set<string>([
		QueryOperator.In,
		QueryOperator.NotIn,
		QueryOperator.InCaseInsensitive,
		QueryOperator.NotInCaseInsensitive,
	]);
	const countOperators = new Set<string>(
		Object.values(QueryOperator).filter((op) => op.startsWith('#')),
	);

	for (const op of Object.values(QueryOperator)) {
		test(`round-trips ${op}`, () => {
			const query = arrayOperators.has(op)
				? `Tags ${op} ["a","b"]`
				: countOperators.has(op)
					? `Ingredients ${op} 3`
					: `Title ${op} "value"`;
			expect(roundTrip(query)).toBe(query);
		});
	}

	test('longest-match tokenizing keeps sibling operators apart', () => {
		expect(roundTrip('Name !~ "x"')).toBe('Name !~ "x"');
		expect(roundTrip('Name ~~ "x"')).toBe('Name ~~ "x"');
		expect(roundTrip('Name _-=* "x"')).toBe('Name _-=* "x"');
		expect(roundTrip('Name !_-=* "x"')).toBe('Name !_-=* "x"');
		expect(roundTrip('Items #>= 3')).toBe('Items #>= 3');
		const ast = parseQuery('Name !_-=* "x"');
		expect(ast).toMatchObject({
			operator: QueryOperator.DoesNotEndWithCaseInsensitive,
		});
	});

	test('operators parse without surrounding whitespace', () => {
		expect(parseQuery('Age>=21&&Name@="x"')).toEqual(
			parseQuery('Age >= 21 && Name @= "x"'),
		);
	});
});

describe('precedence and grouping', () => {
	test('&& binds tighter than ||', () => {
		const ast = parseQuery('A == 1 || B == 2 && C == 3');
		expect(ast).toMatchObject({
			type: 'or',
			left: { type: 'condition' },
			right: { type: 'and' },
		});
	});

	test('parentheses override precedence', () => {
		const ast = parseQuery('(A == 1 || B == 2) && C == 3');
		expect(ast).toMatchObject({
			type: 'and',
			left: { type: 'or' },
			right: { type: 'condition' },
		});
	});

	test('printer parenthesizes defensively, so meaning survives reprinting', () => {
		expect(roundTrip('A == 1 || B == 2 && C == 3')).toBe(
			'A == 1 || (B == 2 && C == 3)',
		);
		expect(roundTrip('(A == 1 || B == 2) && C == 3')).toBe(
			'(A == 1 || B == 2) && C == 3',
		);
	});

	test('same-operator chains stay flat', () => {
		expect(roundTrip('A == 1 && B == 2 && C == 3')).toBe(
			'A == 1 && B == 2 && C == 3',
		);
	});
});

describe('left-hand sides', () => {
	test('property groups', () => {
		const printed = roundTrip('(FirstName, LastName) @=* "paul"');
		expect(printed).toBe('(FirstName, LastName) @=* "paul"');
		expect(parseQuery(printed)).toMatchObject({
			lhs: { kind: 'group', paths: ['FirstName', 'LastName'] },
		});
	});

	test('arithmetic with precedence', () => {
		expect(roundTrip('(Price * Quantity) > 1000')).toBe(
			'(Price * Quantity) > 1000',
		);
		expect(roundTrip('(Total / (Count + 1)) < 100')).toBe(
			'(Total / (Count + 1)) < 100',
		);
		expect(parseQuery('(A + B * C) > 0')).toMatchObject({
			lhs: {
				kind: 'arith',
				expr: {
					kind: 'binary',
					op: '+',
					right: { kind: 'binary', op: '*' },
				},
			},
		});
	});
});

describe('right-hand side classification', () => {
	test.each([
		['DeletedAt == null', { kind: 'null' }],
		['Active == true', { kind: 'boolean', value: true }],
		['Age > 21', { kind: 'number', value: 21 }],
		['Delta > -1.5', { kind: 'number', value: -1.5 }],
		['FirstName == LastName', { kind: 'property', path: 'LastName' }],
		['CreatedAt > 2022-07-01', { kind: 'datetime', raw: '2022-07-01' }],
		[
			'CreatedAt > 2022-07-01T00:00:03Z',
			{ kind: 'datetime', raw: '2022-07-01T00:00:03Z' },
		],
		[
			'Id == 4c9a01ce-30f9-4dcb-a2c5-6d1b4f4ed8f1',
			{ kind: 'guid', raw: '4c9a01ce-30f9-4dcb-a2c5-6d1b4f4ed8f1' },
		],
	])('%s', (query, rhs) => {
		expect(parseQuery(query)).toMatchObject({ rhs });
		roundTrip(query);
	});

	test('escaped quotes and backslashes in strings', () => {
		const ast = parseQuery('Name == "say \\"hi\\" \\\\ bye"');
		expect(ast).toMatchObject({
			rhs: { kind: 'string', value: 'say "hi" \\ bye' },
		});
		roundTrip('Name == "say \\"hi\\" \\\\ bye"');
	});

	test('mixed arrays', () => {
		expect(parseQuery('Score ^^ [1,2.5,true]')).toMatchObject({
			rhs: { kind: 'array', values: [1, 2.5, true] },
		});
	});
});

describe('input handling', () => {
	test('strips the Filters= prefix and handles empty input', () => {
		expect(parseQuery('Filters= Age > 21')).toEqual(parseQuery('Age > 21'));
		expect(parseQuery('')).toBeNull();
		expect(parseQuery(null)).toBeNull();
		expect(parseQuery(undefined)).toBeNull();
		expect(parseQuery('   ')).toBeNull();
	});

	test('errors carry a character position', () => {
		const missing = tryParseQuery('Age == ');
		expect(missing.ok).toBe(false);
		if (!missing.ok) expect(missing.error.position).toBe(7);

		const glued = tryParseQuery('A == 5 B == 6');
		expect(glued.ok).toBe(false);
		if (!glued.ok) expect(glued.error.position).toBe(7);

		expect(tryParseQuery('(A == 5').ok).toBe(false);
		expect(tryParseQuery('Status == Active-Now').ok).toBe(false);
		expect(tryParseQuery('Tags ^^ [a]').ok).toBe(false);
		expect(() => parseQuery('Age == ')).toThrow('Expected a value');
	});
});

describe('builder output round-trips', () => {
	test('every builder construct reparses to the same string', () => {
		const queries = [
			new QueryBuilder()
				.containsCaseInsensitive(['Title', 'Author.Name'], 'king')
				.and()
				.in('Status', ['Active', 'Pending'])
				.and()
				.isNull('DeletedAt')
				.build(),
			new QueryBuilder()
				.greaterThan(arith('Price', '*', 'Quantity'), 1000)
				.or()
				.equals('FirstName', prop('LastName'))
				.build(),
			new QueryBuilder()
				.countGreaterThanOrEqual('Ingredients', 3)
				.and()
				.doesNotSoundLike('Name', 'jon')
				.build(),
			new QueryBuilder().equals('Note', 'quote " and \\ slash').build(),
		];
		for (const query of queries) {
			expect(roundTrip(query)).toBe(query);
		}
	});

	test('concat parens survive', () => {
		const inner = new QueryBuilder().equals('A', 1).or().equals('B', 2);
		const query = new QueryBuilder()
			.equals('C', 3)
			.concat(inner, '&&')
			.build();
		const ast = parseQuery(query);
		expect(ast).toMatchObject({ type: 'and', right: { type: 'or' } });
	});
});

describe('QueryBuilder.from', () => {
	test('hydrates and stays chainable', () => {
		expect(
			QueryBuilder.from('Filters= Age > 21 && Status == "Active"')
				.and()
				.contains('Name', 'x')
				.build(),
		).toBe('Age > 21 && Status == "Active" && Name @= "x"');
	});

	test('parenthesizes a top-level || before further chaining', () => {
		expect(
			QueryBuilder.from('Age > 21 || VIP == true')
				.and()
				.equals('Status', 'Active')
				.build(),
		).toBe('(Age > 21 || VIP == true) && Status == "Active"');
	});

	test('empty input yields an empty builder', () => {
		expect(QueryBuilder.from(null).build()).toBe('');
		expect(QueryBuilder.from('').equals('A', 1).build()).toBe('A == 1');
	});

	test('throws on malformed input', () => {
		expect(() => QueryBuilder.from('Age == ')).toThrow('Expected a value');
	});
});

describe('validateQuery via the parser', () => {
	test('reports positions for real syntax errors', () => {
		const result = validateQuery('Age >< 21');
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.errors[0]).toMatch(/position/);
		}
	});

	test('now rejects garbage the old shape-checker accepted', () => {
		expect(validateQuery('Age == @#$').valid).toBe(false);
	});
});
