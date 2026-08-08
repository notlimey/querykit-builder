import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { arith, isArithExpression, prop } from '../../src/expressions';
import { QueryOperator } from '../../src/types';
import { validateQuery } from '../../src/validator';

const builder = () => new QueryBuilder(false, false);

test('supports each arithmetic operator', () => {
	expect(
		builder()
			.greaterThan(arith('Age', '+', 'Rating'), 50)
			.build(),
	).toBe('(Age + Rating) > 50');
	expect(
		builder()
			.greaterThan(arith('Age', '-', 'Rating'), 0)
			.build(),
	).toBe('(Age - Rating) > 0');
	expect(
		builder()
			.greaterThan(arith('Price', '*', 'Quantity'), 1000)
			.build(),
	).toBe('(Price * Quantity) > 1000');
	expect(
		builder()
			.lessThan(arith('Total', '/', 'Count'), 100)
			.build(),
	).toBe('(Total / Count) < 100');
	expect(
		builder()
			.equals(arith('Id', '%', 2), 0)
			.build(),
	).toBe('(Id % 2) == 0');
});

test('nests expressions to force precedence', () => {
	const query = builder()
		.lessThan(arith('Total', '/', arith('Count', '+', 1)), 100)
		.build();

	expect(query).toBe('(Total / (Count + 1)) < 100');
});

test('accepts variadic operand/operator chains', () => {
	expect(
		builder()
			.greaterThan(arith('A', '+', 'B', '-', 'C'), 10)
			.build(),
	).toBe('(A + B - C) > 10');
});

test('mixes properties, prop() refs and numeric literals', () => {
	expect(
		builder()
			.greaterThanOrEqual(arith(prop('Score'), '+', 'Bonus'), 50)
			.build(),
	).toBe('(Score + Bonus) >= 50');
	expect(
		builder()
			.lessThan(arith('Price', '*', 1.25), 100)
			.build(),
	).toBe('(Price * 1.25) < 100');
});

test('works on the value side of a condition', () => {
	expect(
		builder()
			.greaterThan('Total', arith('Price', '*', 'Quantity'))
			.build(),
	).toBe('Total > (Price * Quantity)');
});

test('rejects malformed part sequences', () => {
	expect(() => arith('Age')).toThrow(/alternating operands and operators/);
	expect(() => arith('Age', '+')).toThrow(
		/alternating operands and operators/,
	);
	// biome-ignore lint/suspicious/noExplicitAny: verifying a runtime guard
	expect(() => arith('Age', 'x' as any, 'Rating')).toThrow(
		/arithmetic operator/,
	);
	// biome-ignore lint/suspicious/noExplicitAny: verifying a runtime guard
	expect(() => arith('+' as any, '+', 'Rating')).toThrow(
		/expected an operand/,
	);
});

test('exposes the expression on the token', () => {
	const expression = arith('Price', '*', 'Quantity');
	const qb = builder().greaterThan(expression, 1000);

	expect(isArithExpression(expression)).toBe(true);
	expect(qb.getTokens()).toEqual([
		{
			type: 'condition',
			property: '(Price * Quantity)',
			operator: QueryOperator.GreaterThan,
			value: 1000,
		},
	]);
});

test('arithmetic queries pass validation', () => {
	const query = builder()
		.greaterThan(arith('Price', '*', 'Quantity'), 1000)
		.and()
		.equals(arith('Id', '%', 2), 0)
		.and()
		.lessThan(arith('Total', '/', arith('Count', '+', 1)), 100)
		.build();

	expect(validateQuery(query)).toEqual({ valid: true });
});
