import { expect, test } from 'vitest';
import { faker } from '@faker-js/faker';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';

const builder = () => new QueryBuilder(false, false);

test('escapes embedded quotes and backslashes', () => {
	const qb = builder();
	const name = `Bob "${faker.person.firstName()}"`;
	const path = `C:\\Temp\\${faker.system.fileName()}`;
	qb.equals('Name', name).contains('Path', path);

	const escapedName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
	const escapedPath = path.replace(/\\/g, '\\\\');

	expect(qb.build()).toBe(
		`Name == "${escapedName}" Path @= "${escapedPath}"`,
	);
});

test('exposes typed tokens for inspection', () => {
	const qb = builder();
	const id = faker.number.int({ min: 1, max: 1000 });
	const nameFragment = faker.word.sample();
	qb.equals('User.Id', id).and().contains('User.Name', nameFragment);

	expect(qb.getTokens()).toEqual([
		{ type: 'condition', property: 'User.Id', operator: QueryOperator.Equals, value: id },
		{ type: 'logical', operator: '&&' },
		{
			type: 'condition',
			property: 'User.Name',
			operator: QueryOperator.Contains,
			value: nameFragment,
		},
	]);
});
