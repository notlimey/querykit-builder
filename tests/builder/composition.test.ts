import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';

const qb = () => new QueryBuilder(false, false);

test('append raw strings and builders with operators', () => {
	const builder = qb();
	builder.equals('Age', 30);
	builder.append('Name == "John"', '&&');
	expect(builder.build()).toBe('Age == 30 && Name == "John"');

	const builder2 = qb();
	builder2.equals('Name', 'Jane');
	builder.append(builder2, '||');

	expect(builder.build()).toBe('Age == 30 && Name == "John" || Name == "Jane"');
});

test('respects Filters= prefix removal when appending', () => {
	const lhs = qb().equals('Age', 30);
	const rhs = new QueryBuilder(false, true).equals('Name', 'John');

	lhs.append(rhs, '&&');
	expect(lhs.build()).toBe('Age == 30 && Name == "John"');
});

test('trims trailing operators', () => {
	const builder = qb();
	builder.equals('Age', 30).and();
	expect(builder.build()).toBe('Age == 30');
});

test('avoids duplicate logical operators when appending after and/or', () => {
	const builder = qb();
	builder.equals('Age', 30).and();
	builder.append('Name == "John"', '&&');
	expect(builder.build()).toBe('Age == 30 && Name == "John"');
});

test('open/close paren with concat builds grouped clauses', () => {
	const left = qb().openParen().equals('User.Id', 5).or().equals('User.Id', 6).closeParen();
	const right = qb().openParen().equals('Status', 'Active').and().contains('User.Name', 'not').closeParen();

	const combined = qb().concat(left).and().concat(right);
	expect(combined.build()).toBe('((User.Id == 5 || User.Id == 6 )) && ((Status == "Active" && User.Name @= "not" ))');
});
