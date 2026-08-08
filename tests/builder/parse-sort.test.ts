import { expect, test } from 'vitest';
import { parseSort, SortBuilder } from '../../src/sort-builder';

test('parses sieve syntax', () => {
	expect(parseSort('Title, -Age, -Author.Name')).toEqual([
		{ property: 'Title', direction: 'asc' },
		{ property: 'Age', direction: 'desc' },
		{ property: 'Author.Name', direction: 'desc' },
	]);
});

test('parses verbose syntax, case-insensitively', () => {
	expect(parseSort('Title asc, Age DESC')).toEqual([
		{ property: 'Title', direction: 'asc' },
		{ property: 'Age', direction: 'desc' },
	]);
});

test('defaults to ascending and tolerates loose spacing', () => {
	expect(parseSort('  Title ,Age  ')).toEqual([
		{ property: 'Title', direction: 'asc' },
		{ property: 'Age', direction: 'asc' },
	]);
});

test('sign prefix wins over a conflicting direction keyword', () => {
	expect(parseSort('-Title asc, +Age desc')).toEqual([
		{ property: 'Title', direction: 'desc' },
		{ property: 'Age', direction: 'desc' },
	]);
});

test('returns an empty list for empty input', () => {
	expect(parseSort('')).toEqual([]);
	expect(parseSort(null)).toEqual([]);
	expect(parseSort(undefined)).toEqual([]);
	expect(parseSort(' , , ')).toEqual([]);
});

test('skips entries it cannot parse', () => {
	expect(parseSort('Title, Age desc extra, Rating')).toEqual([
		{ property: 'Title', direction: 'asc' },
		{ property: 'Rating', direction: 'asc' },
	]);
});

test('round-trips through SortBuilder.from', () => {
	expect(SortBuilder.from('Title, -Age').build()).toBe('Title, -Age');
	expect(SortBuilder.from('Title asc, Age desc').build()).toBe('Title, -Age');
	expect(SortBuilder.from('Title, -Age', { style: 'verbose' }).build()).toBe(
		'Title asc, Age desc',
	);
	expect(SortBuilder.from(null).build()).toBe('');
});

test('normalizes a messy url value', () => {
	expect(SortBuilder.from('  -CreatedAt ,Title asc ').build()).toBe(
		'-CreatedAt, Title',
	);
});
