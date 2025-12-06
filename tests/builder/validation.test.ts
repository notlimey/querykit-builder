import { expect, test } from 'vitest';
import { faker } from '@faker-js/faker';
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
