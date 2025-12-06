import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';

const builder = () => new QueryBuilder(false, false);

test('case-insensitive equality and patterns', () => {
	const qb = builder();
	qb.equalsCaseInsensitive('Username', 'admin')
		.notEqualsCaseInsensitive('Email', 'admin@example.com')
		.startsWithCaseInsensitive('City', 'los')
		.doesNotStartWithCaseInsensitive('Country', 'can')
		.endsWithCaseInsensitive('Filename', '.PDF')
		.doesNotEndWithCaseInsensitive('Domain', '.COM')
		.containsCaseInsensitive('Description', 'Lorem Ipsum')
		.doesNotContainCaseInsensitive('Notes', 'Temporary Data');

	expect(qb.build()).toBe(
		[
			`Username ${QueryOperator.EqualsCaseInsensitive} "admin"`,
			`Email ${QueryOperator.NotEqualsCaseInsensitive} "admin@example.com"`,
			`City ${QueryOperator.StartsWithCaseInsensitive} "los"`,
			`Country ${QueryOperator.DoesNotStartWithCaseInsensitive} "can"`,
			`Filename ${QueryOperator.EndsWithCaseInsensitive} ".PDF"`,
			`Domain ${QueryOperator.DoesNotEndWithCaseInsensitive} ".COM"`,
			`Description ${QueryOperator.ContainsCaseInsensitive} "Lorem Ipsum"`,
			`Notes ${QueryOperator.DoesNotContainCaseInsensitive} "Temporary Data"`,
		].join(' '),
	);
});

test('case-insensitive membership and existence', () => {
	const qb = builder();
	qb.hasCaseInsensitive('Tags', 'Urgent')
		.doesNotHaveCaseInsensitive('Categories', 'Obsolete')
		.inCaseInsensitive('Status', ['Active', 'Pending', 'Closed'])
		.notInCaseInsensitive('Role', ['Admin', undefined, 'User']);

	expect(qb.build()).toBe(
		[
			`Tags ${QueryOperator.HasCaseInsensitive} "Urgent"`,
			`Categories ${QueryOperator.DoesNotHaveCaseInsensitive} "Obsolete"`,
			`Status ${QueryOperator.InCaseInsensitive} ["Active","Pending","Closed"]`,
			`Role ${QueryOperator.NotInCaseInsensitive} ["Admin","User"]`,
		].join(' '),
	);
});
