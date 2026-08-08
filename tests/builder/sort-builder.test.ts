import { faker } from '@faker-js/faker';
import { expect, test } from 'vitest';
import { SortBuilder } from '../../src/sort-builder';

test('renders sieve syntax by default', () => {
	const sort = new SortBuilder()
		.asc('Title')
		.desc('Age')
		.desc('Author.Name')
		.build();

	expect(sort).toBe('Title, -Age, -Author.Name');
});

test('renders verbose syntax on request', () => {
	const builder = new SortBuilder().asc('Title').desc('Age');

	expect(builder.build({ style: 'verbose' })).toBe('Title asc, Age desc');
	expect(new SortBuilder({ style: 'verbose' }).desc('Age').build()).toBe(
		'Age desc',
	);
});

test('sortBy defaults to ascending', () => {
	expect(new SortBuilder().sortBy('Title').build()).toBe('Title');
	expect(new SortBuilder().sortBy('Title', 'desc').build()).toBe('-Title');
});

test('skips null, undefined and blank properties', () => {
	const sort = new SortBuilder()
		.asc(null)
		.desc(undefined)
		.asc('   ')
		.desc('Age')
		.build();

	expect(sort).toBe('-Age');
});

test('trims whitespace around property names', () => {
	expect(new SortBuilder().asc('  Title  ').build()).toBe('Title');
});

test('remove and replace manage existing entries', () => {
	const builder = new SortBuilder().asc('Title').desc('Age');

	expect(builder.clone().remove('Title').build()).toBe('-Age');
	expect(builder.clone().replace('Age', 'asc').build()).toBe('Title, Age');
	expect(builder.build()).toBe('Title, -Age');
});

test('clear empties the builder', () => {
	expect(new SortBuilder().asc('Title').clear().build()).toBe('');
});

test('exposes tokens', () => {
	const property = faker.word.sample();
	const builder = new SortBuilder().desc(property);

	expect(builder.getTokens()).toEqual([{ property, direction: 'desc' }]);
});

test('encodes for URIs when configured', () => {
	expect(
		new SortBuilder({ encodeUri: true }).asc('Title').desc('Age').build(),
	).toBe('Title%2C%20-Age');
});

test('clone does not share state', () => {
	const original = new SortBuilder().asc('Title');
	const cloned = original.clone().desc('Age');

	expect(original.build()).toBe('Title');
	expect(cloned.build()).toBe('Title, -Age');
});
