import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';

const builder = () => new QueryBuilder(false, false);

test('basic equality operators', () => {
	const qb = builder();
	qb.equals('Age', 30)
		.notEquals('Name', 'John')
		.greaterThan('Score', 85)
		.lessThan('Height', 180)
		.greaterThanOrEqual('Weight', 70)
		.lessThanOrEqual('Temperature', 25);

	expect(qb.build()).toBe(
		[
			`Age ${QueryOperator.Equals} 30`,
			`Name ${QueryOperator.NotEquals} "John"`,
			`Score ${QueryOperator.GreaterThan} 85`,
			`Height ${QueryOperator.LessThan} 180`,
			`Weight ${QueryOperator.GreaterThanOrEqual} 70`,
			`Temperature ${QueryOperator.LessThanOrEqual} 25`,
		].join(' '),
	);
});

test('string pattern operators', () => {
	const qb = builder();
	qb.startsWith('City', 'New')
		.doesNotStartWith('Country', 'Uni')
		.endsWith('Filename', '.txt')
		.doesNotEndWith('Domain', '.org')
		.contains('Description', 'lorem')
		.doesNotContain('Notes', 'temporary')
		.soundsLike('Name', 'Smith')
		.doesNotSoundLike('Word', 'example');

	expect(qb.build()).toBe(
		[
			`City ${QueryOperator.StartsWith} "New"`,
			`Country ${QueryOperator.DoesNotStartWith} "Uni"`,
			`Filename ${QueryOperator.EndsWith} ".txt"`,
			`Domain ${QueryOperator.DoesNotEndWith} ".org"`,
			`Description ${QueryOperator.Contains} "lorem"`,
			`Notes ${QueryOperator.DoesNotContain} "temporary"`,
			`Name ${QueryOperator.SoundsLike} "Smith"`,
			`Word ${QueryOperator.DoesNotSoundLike} "example"`,
		].join(' '),
	);
});

test('set membership and existence operators', () => {
	const qb = builder();
	qb.has('Tags', 'urgent')
		.doesNotHave('Categories', 'obsolete')
		.in('Status', ['active', 'pending', 'closed'])
		.notIn('Region', ['us', null, 'eu', undefined]);

	expect(qb.build()).toBe(
		[
			`Tags ${QueryOperator.Has} "urgent"`,
			`Categories ${QueryOperator.DoesNotHave} "obsolete"`,
			`Status ${QueryOperator.In} ["active","pending","closed"]`,
			`Region ${QueryOperator.NotIn} ["us","eu"]`,
		].join(' '),
	);
});
