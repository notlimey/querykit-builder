import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';
import { validateQuery } from '../../src/validator';

const builder = () => new QueryBuilder(false, false);

test('emits unquoted null checks', () => {
	const query = builder()
		.isNull('DeletedAt')
		.or()
		.isNotNull('Author.Email')
		.build();

	expect(query).toBe('DeletedAt == null || Author.Email != null');
});

test('does not quote the literal string "null" differently', () => {
	const query = builder()
		.equals('Title', 'null')
		.and()
		.isNull('Title')
		.build();

	expect(query).toBe('Title == "null" && Title == null');
});

test('null checks work with property list grouping', () => {
	expect(builder().isNull(['DeletedAt', 'ArchivedAt']).build()).toBe(
		'(DeletedAt, ArchivedAt) == null',
	);
});

test('passing null to a normal operator remains a no-op', () => {
	const query = builder()
		.equals('Title', null)
		.equals('Status', undefined)
		.isNull('DeletedAt')
		.build();

	expect(query).toBe('DeletedAt == null');
});

test('emits a dedicated token type', () => {
	const qb = builder().isNull('DeletedAt').and().isNotNull('PublishedAt');

	expect(qb.getTokens()).toEqual([
		{
			type: 'nullCondition',
			property: 'DeletedAt',
			operator: QueryOperator.Equals,
		},
		{ type: 'logical', operator: '&&' },
		{
			type: 'nullCondition',
			property: 'PublishedAt',
			operator: QueryOperator.NotEquals,
		},
	]);
});

test('null checks pass validation', () => {
	const query = builder()
		.isNull('DeletedAt')
		.and()
		.greaterThan('Age', 21)
		.build();

	expect(validateQuery(query)).toEqual({ valid: true });
});
