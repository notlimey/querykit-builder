import { faker } from '@faker-js/faker';
import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';
import { validateQuery } from '../../src/validator';

const builder = () => new QueryBuilder(false, false);

test('renders a property list for positive operators', () => {
	const search = faker.person.firstName();

	const query = builder()
		.containsCaseInsensitive(['FirstName', 'LastName', 'Email'], search)
		.build();

	expect(query).toBe(`(FirstName, LastName, Email) @=* "${search}"`);
});

test('renders a property list for negative operators', () => {
	const query = builder()
		.doesNotContainCaseInsensitive(['FirstName', 'LastName'], 'test')
		.build();

	expect(query).toBe('(FirstName, LastName) !@=* "test"');
});

test('supports nested properties in a group', () => {
	const query = builder()
		.containsCaseInsensitive(
			['Author.Name', 'Author.Email', 'Title'],
			'john',
		)
		.build();

	expect(query).toBe('(Author.Name, Author.Email, Title) @=* "john"');
});

test('works with numeric comparison operators', () => {
	const query = builder()
		.greaterThanOrEqual(['Age', 'YearsOfExperience', 'Rating'], 5)
		.build();

	expect(query).toBe('(Age, YearsOfExperience, Rating) >= 5');
});

test('works with array operators', () => {
	const query = builder()
		.in(['Status', 'Type'], ['Active', 'Pending'])
		.build();

	expect(query).toBe('(Status, Type) ^^ ["Active","Pending"]');
});

test('works with count operators', () => {
	const query = builder().countGreaterThan(['Tags', 'Categories'], 2).build();

	expect(query).toBe('(Tags, Categories) #> 2');
});

test('combines groups with other conditions', () => {
	const query = builder()
		.containsCaseInsensitive(['FirstName', 'LastName'], 'smith')
		.and()
		.greaterThan('Age', 25)
		.and()
		.containsCaseInsensitive(['Email', 'Phone'], '555')
		.build();

	expect(query).toBe(
		'(FirstName, LastName) @=* "smith" && Age > 25 && (Email, Phone) @=* "555"',
	);
});

test('groups inside explicit parentheses', () => {
	const query = builder()
		.openParen()
		.containsCaseInsensitive(['FirstName', 'LastName'], 'smith')
		.or()
		.equals('Age', 30)
		.closeParen()
		.and()
		.equals('Status', 'Active')
		.build();

	expect(query).toBe(
		'((FirstName, LastName) @=* "smith" || Age == 30) && Status == "Active"',
	);
});

test('a single-element list still renders as a group', () => {
	expect(builder().equals(['Status'], 'Active').build()).toBe(
		'(Status) == "Active"',
	);
});

test('an empty property list throws', () => {
	expect(() => builder().equals([], 'Active')).toThrow(
		/at least one property/,
	);
});

test('null values still skip the condition', () => {
	expect(
		builder()
			.containsCaseInsensitive(['FirstName', 'LastName'], null)
			.build(),
	).toBe('');
});

test('exposes the property list on the token', () => {
	const qb = builder().containsCaseInsensitive(
		['FirstName', 'LastName'],
		'jo',
	);

	expect(qb.getTokens()).toEqual([
		{
			type: 'condition',
			property: '(FirstName, LastName)',
			properties: ['FirstName', 'LastName'],
			operator: QueryOperator.ContainsCaseInsensitive,
			value: 'jo',
		},
	]);
});

test('grouped queries pass validation', () => {
	const query = builder()
		.containsCaseInsensitive(['FirstName', 'LastName'], 'john')
		.and()
		.greaterThan('Age', 25)
		.build();

	expect(validateQuery(query)).toEqual({ valid: true });
});
