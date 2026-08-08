import { faker } from '@faker-js/faker';
import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { validateQuery } from '../../src/validator';

test('validateQuery accepts well-formed queries', () => {
	const id = faker.number.int({ min: 1, max: 500 });
	const city = faker.word.sample();

	const qb = new QueryBuilder(false, false)
		.equals('User.Id', id)
		.and()
		.contains('User.City', city);

	const result = validateQuery(qb.build());
	expect(result).toEqual({ valid: true });
});

test('validateQuery rejects missing logical operator between conditions', () => {
	const bad = 'User.Id == 5 User.Name @= "not"';
	const result = validateQuery(bad);
	expect(result.valid).toBe(false);
	expect(result).toHaveProperty('errors');
});

test('validateQuery catches unmatched parentheses', () => {
	const result = validateQuery('(User.Id == 5 || User.Id == 6');
	expect(result.valid).toBe(false);
	expect(result).toHaveProperty('errors');
});

test('validateQuery accepts property list grouping', () => {
	expect(validateQuery('(FirstName, LastName) @=* "paul"')).toEqual({
		valid: true,
	});
	expect(
		validateQuery(
			'(FirstName, LastName) @=* "john" && (Email, Phone) @=* "555"',
		),
	).toEqual({ valid: true });
	expect(
		validateQuery(
			'((FirstName, LastName) @=* "smith" || Age == 30) && Status == "Active"',
		),
	).toEqual({ valid: true });
});

test('validateQuery accepts arithmetic and property comparisons', () => {
	expect(validateQuery('(Price * Quantity) > 1000')).toEqual({ valid: true });
	expect(validateQuery('(Total / (Count + 1)) < 100')).toEqual({
		valid: true,
	});
	expect(validateQuery('FirstName == LastName && Age > Rating')).toEqual({
		valid: true,
	});
	expect(validateQuery('DeletedAt == null')).toEqual({ valid: true });
});

test('validateQuery still treats logical parens as grouping', () => {
	expect(validateQuery('(Status == "Active" && Age > 5)')).toEqual({
		valid: true,
	});
	expect(validateQuery('(Status == "Active" Age > 5)').valid).toBe(false);
});

test('validateQuery rejects a property expression without a value', () => {
	const result = validateQuery('(Price * Quantity) >');
	expect(result.valid).toBe(false);
	expect(result).toHaveProperty('errors');
});
