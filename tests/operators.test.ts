import { expect, test } from 'vitest';
import QueryBuilder from '../src/builder';
import { QueryOperator } from '../src/types';

const queryBuilder = () => new QueryBuilder(false, false);

test('Equals operator', () => {
	const builder = queryBuilder();
	builder.equals('Age', 30);
	expect(builder.build()).toBe(`Age ${QueryOperator.Equals} 30`);
});

test('Not equals operator', () => {
	const builder = queryBuilder();
	builder.notEquals('Name', 'John');
	expect(builder.build()).toBe(`Name ${QueryOperator.NotEquals} "John"`);
});

test('Greater than operator', () => {
	const builder = queryBuilder();
	builder.greaterThan('Score', 85);
	expect(builder.build()).toBe(`Score ${QueryOperator.GreaterThan} 85`);
});

test('Less than operator', () => {
	const builder = queryBuilder();
	builder.lessThan('Height', 180);
	expect(builder.build()).toBe(`Height ${QueryOperator.LessThan} 180`);
});

test('Greater than or equal operator', () => {
	const builder = queryBuilder();
	builder.greaterThanOrEqual('Weight', 70);
	expect(builder.build()).toBe(
		`Weight ${QueryOperator.GreaterThanOrEqual} 70`,
	);
});

test('Less than or equal operator', () => {
	const builder = queryBuilder();
	builder.lessThanOrEqual('Temperature', 25);
	expect(builder.build()).toBe(
		`Temperature ${QueryOperator.LessThanOrEqual} 25`,
	);
});

test('Starts with operator', () => {
	const builder = queryBuilder();
	builder.startsWith('City', 'New');
	expect(builder.build()).toBe(`City ${QueryOperator.StartsWith} "New"`);
});

test('Append operator', () => {
	const builder = queryBuilder();
	builder.equals('Age', 30);
	builder.append('AND Name == "John"');
	expect(builder.build()).toBe(
		`Age ${QueryOperator.Equals} 30 AND Name == "John"`,
	);
});

test('Append builder', () => {
	const builder1 = queryBuilder();
	builder1.equals('Age', 30);

	const builder2 = queryBuilder();
	builder2.equals('Name', 'John');

	builder1.append(builder2);
	expect(builder1.build()).toBe(
		`Age ${QueryOperator.Equals} 30 Name ${QueryOperator.Equals} "John"`,
	);
});

test('Does not start with operator', () => {
	const builder = queryBuilder();
	builder.doesNotStartWith('Country', 'Uni');
	expect(builder.build()).toBe(
		`Country ${QueryOperator.DoesNotStartWith} "Uni"`,
	);
});

test('Ends with operator', () => {
	const builder = queryBuilder();
	builder.endsWith('Filename', '.txt');
	expect(builder.build()).toBe(`Filename ${QueryOperator.EndsWith} ".txt"`);
});

test('Does not end with operator', () => {
	const builder = queryBuilder();
	builder.doesNotEndWith('Domain', '.org');
	expect(builder.build()).toBe(
		`Domain ${QueryOperator.DoesNotEndWith} ".org"`,
	);
});

test('Contains operator', () => {
	const builder = queryBuilder();
	builder.contains('Description', 'lorem');
	expect(builder.build()).toBe(
		`Description ${QueryOperator.Contains} "lorem"`,
	);
});

test('Does not contain operator', () => {
	const builder = queryBuilder();
	builder.doesNotContain('Notes', 'temporary');
	expect(builder.build()).toBe(
		`Notes ${QueryOperator.DoesNotContain} "temporary"`,
	);
});

test('Sounds like operator', () => {
	const builder = queryBuilder();
	builder.soundsLike('Name', 'Smith');
	expect(builder.build()).toBe(`Name ${QueryOperator.SoundsLike} "Smith"`);
});

test('Does not sound like operator', () => {
	const builder = queryBuilder();
	builder.doesNotSoundLike('Word', 'example');
	expect(builder.build()).toBe(
		`Word ${QueryOperator.DoesNotSoundLike} "example"`,
	);
});

test('Has operator', () => {
	const builder = queryBuilder();
	builder.has('Tags', 'urgent');
	expect(builder.build()).toBe(`Tags ${QueryOperator.Has} "urgent"`);
});

test('Does not have operator', () => {
	const builder = queryBuilder();
	builder.doesNotHave('Categories', 'obsolete');
	expect(builder.build()).toBe(
		`Categories ${QueryOperator.DoesNotHave} "obsolete"`,
	);
});

test('In operator', () => {
	const builder = queryBuilder();
	builder.in('Status', ['active', 'pending', 'closed']);
	expect(builder.build()).toBe(
		`Status ${QueryOperator.In} ["active","pending","closed"]`,
	);
});

test('Equals case insensitive operator', () => {
	const builder = queryBuilder();
	builder.equalsCaseInsensitive('Username', 'admin');
	expect(builder.build()).toBe(
		`Username ${QueryOperator.EqualsCaseInsensitive} "admin"`,
	);
});

test('Not equals case insensitive operator', () => {
	const builder = queryBuilder();
	builder.notEqualsCaseInsensitive('Email', 'admin@example.com');
	expect(builder.build()).toBe(
		`Email ${QueryOperator.NotEqualsCaseInsensitive} "admin@example.com"`,
	);
});

test('Starts with case insensitive operator', () => {
	const builder = queryBuilder();
	builder.startsWithCaseInsensitive('City', 'los');
	expect(builder.build()).toBe(
		`City ${QueryOperator.StartsWithCaseInsensitive} "los"`,
	);
});

test('Does not start with case insensitive operator', () => {
	const builder = queryBuilder();
	builder.doesNotStartWithCaseInsensitive('Country', 'can');
	expect(builder.build()).toBe(
		`Country ${QueryOperator.DoesNotStartWithCaseInsensitive} "can"`,
	);
});

test('Ends with case insensitive operator', () => {
	const builder = queryBuilder();
	builder.endsWithCaseInsensitive('Filename', '.PDF');
	expect(builder.build()).toBe(
		`Filename ${QueryOperator.EndsWithCaseInsensitive} ".PDF"`,
	);
});

test('Does not end with case insensitive operator', () => {
	const builder = queryBuilder();
	builder.doesNotEndWithCaseInsensitive('Domain', '.COM');
	expect(builder.build()).toBe(
		`Domain ${QueryOperator.DoesNotEndWithCaseInsensitive} ".COM"`,
	);
});

test('Contains case insensitive operator', () => {
	const builder = queryBuilder();
	builder.containsCaseInsensitive('Description', 'Lorem Ipsum');
	expect(builder.build()).toBe(
		`Description ${QueryOperator.ContainsCaseInsensitive} "Lorem Ipsum"`,
	);
});

test('Does not contain case insensitive operator', () => {
	const builder = queryBuilder();
	builder.doesNotContainCaseInsensitive('Notes', 'Temporary Data');
	expect(builder.build()).toBe(
		`Notes ${QueryOperator.DoesNotContainCaseInsensitive} "Temporary Data"`,
	);
});

test('Has case insensitive operator', () => {
	const builder = queryBuilder();
	builder.hasCaseInsensitive('Tags', 'Urgent');
	expect(builder.build()).toBe(
		`Tags ${QueryOperator.HasCaseInsensitive} "Urgent"`,
	);
});

test('Does not have case insensitive operator', () => {
	const builder = queryBuilder();
	builder.doesNotHaveCaseInsensitive('Categories', 'Obsolete');
	expect(builder.build()).toBe(
		`Categories ${QueryOperator.DoesNotHaveCaseInsensitive} "Obsolete"`,
	);
});

test('In case insensitive operator', () => {
	const builder = queryBuilder();
	builder.inCaseInsensitive('Status', ['Active', 'Pending', 'Closed']);
	expect(builder.build()).toBe(
		`Status ${QueryOperator.InCaseInsensitive} ["Active","Pending","Closed"]`,
	);
});

test('Count greater than operator', () => {
	const builder = queryBuilder();
	builder.countGreaterThan('Comments', 5);
	expect(builder.build()).toBe(
		`Comments ${QueryOperator.CountGreaterThan} 5`,
	);
});

test('Count less than operator', () => {
	const builder = queryBuilder();
	builder.countLessThan('Likes', 100);
	expect(builder.build()).toBe(`Likes ${QueryOperator.CountLessThan} 100`);
});

test('Count greater than or equal operator', () => {
	const builder = queryBuilder();
	builder.countGreaterThanOrEqual('Shares', 50);
	expect(builder.build()).toBe(
		`Shares ${QueryOperator.CountGreaterThanOrEqual} 50`,
	);
});

test('Count less than or equal operator', () => {
	const builder = queryBuilder();
	builder.countLessThanOrEqual('Views', 200);
	expect(builder.build()).toBe(
		`Views ${QueryOperator.CountLessThanOrEqual} 200`,
	);
});

test('Count equals operator', () => {
	const builder = queryBuilder();
	builder.countEquals('Attachments', 3);
	expect(builder.build()).toBe(`Attachments ${QueryOperator.CountEquals} 3`);
});

test('Count not equals operator', () => {
	const builder = queryBuilder();
	builder.countNotEquals('Tags', 2);
	expect(builder.build()).toBe(`Tags ${QueryOperator.CountNotEquals} 2`);
});
