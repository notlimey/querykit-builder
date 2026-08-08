import { faker } from '@faker-js/faker';
import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { isPropertyRef, prop } from '../../src/expressions';
import { QueryOperator } from '../../src/types';
import { validateQuery } from '../../src/validator';

const builder = () => new QueryBuilder(false, false);

test('compares two properties instead of quoting a literal', () => {
	const query = builder().equals('FirstName', prop('LastName')).build();

	expect(query).toBe('FirstName == LastName');
});

test('works across all comparison operators', () => {
	const query = builder()
		.notEquals('FirstName', prop('LastName'))
		.and()
		.greaterThan('Age', prop('Rating'))
		.and()
		.lessThanOrEqual('Score1', prop('Score2'))
		.build();

	expect(query).toBe(
		'FirstName != LastName && Age > Rating && Score1 <= Score2',
	);
});

test('compares child properties to root properties', () => {
	const query = builder()
		.equals('Author.Name', prop('Title'))
		.and()
		.equals('Email.Value', prop('CollectionEmail.Value'))
		.build();

	expect(query).toBe(
		'Author.Name == Title && Email.Value == CollectionEmail.Value',
	);
});

test('string operators accept a property reference unquoted', () => {
	expect(builder().contains('Title', prop('Author.Name')).build()).toBe(
		'Title @= Author.Name',
	);
	expect(builder().startsWith('Title', prop('Prefix')).build()).toBe(
		'Title _= Prefix',
	);
});

test('a literal that matches a property name stays quoted', () => {
	const query = builder()
		.equals('FirstName', 'LastName')
		.and()
		.equals('FirstName', prop('LastName'))
		.build();

	expect(query).toBe('FirstName == "LastName" && FirstName == LastName');
});

test('the property side accepts prop() too', () => {
	expect(builder().equals(prop('Author.Name'), prop('Title')).build()).toBe(
		'Author.Name == Title',
	);
});

test('mixes property comparisons with regular filters and grouping', () => {
	const age = faker.number.int({ min: 18, max: 60 });

	const query = builder()
		.openParen()
		.notEquals('FirstName', prop('LastName'))
		.and()
		.greaterThan('Age', prop('Rating'))
		.closeParen()
		.or()
		.lessThanOrEqual('Score1', prop('Score2'))
		.and()
		.greaterThan('Age', age)
		.build();

	expect(query).toBe(
		`(FirstName != LastName && Age > Rating) || Score1 <= Score2 && Age > ${age}`,
	);
});

test('keeps the reference on the token', () => {
	const qb = builder().equals('FirstName', prop('LastName'));
	const [token] = qb.getTokens();

	expect(token).toEqual({
		type: 'condition',
		property: 'FirstName',
		operator: QueryOperator.Equals,
		value: { __querykit: 'property', name: 'LastName' },
	});
	expect(isPropertyRef(token.type === 'condition' ? token.value : null)).toBe(
		true,
	);
});

test('null/undefined property refs are impossible but null values still skip', () => {
	expect(builder().equals('FirstName', null).build()).toBe('');
});

test('property comparisons pass validation', () => {
	const query = builder()
		.equals('FirstName', prop('LastName'))
		.and()
		.greaterThan('Age', 21)
		.build();

	expect(validateQuery(query)).toEqual({ valid: true });
});
