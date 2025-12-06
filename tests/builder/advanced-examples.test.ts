import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { faker } from '@faker-js/faker';

const qb = () => new QueryBuilder(false, false);

test('advanced user filter example (id and name)', () => {
	const builder = qb();
	const userId = faker.number.int({ min: 1, max: 9999 });
	const nameFragment = faker.word.sample();
	builder.equals('User.Id', userId).and().contains('User.Name', nameFragment);

	expect(builder.build()).toBe(
		`User.Id == ${userId} && User.Name @= "${nameFragment}"`,
	);
});

test('nested precedence example with explicit grouping', () => {
	const builder = qb();
	const idA = faker.number.int({ min: 1, max: 50 });
	const idB = faker.number.int({ min: 51, max: 100 });
	const nameFragment = faker.word.sample();
	const domain = faker.internet.domainName();
	builder
		.openParen()
		.equals('User.Id', idA)
		.or()
		.equals('User.Id', idB)
		.closeParen()
		.and()
		.openParen()
		.contains('User.Name', nameFragment)
		.or()
		.endsWith('User.Email', `@${domain}`)
		.closeParen();

	expect(builder.build()).toBe(
		`(User.Id == ${idA} || User.Id == ${idB} ) && (User.Name @= "${nameFragment}" || User.Email _-= "@${domain}" )`,
	);
});

test('composition via append with mixed inputs', () => {
	const status = faker.helpers.arrayElement(['Active', 'Pending', 'Closed']);
	const nameFragment = faker.word.sample();
	const base = qb().equals('Status', status);
	const extra = new QueryBuilder().contains('User.Name', nameFragment);

	const combined = qb().append(base).append(extra, '&&');

	expect(combined.build()).toBe(
		`Status == "${status}" && User.Name @= "${nameFragment}"`,
	);
});
