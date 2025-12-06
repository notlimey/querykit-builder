import { expect, test } from 'vitest';
import QueryBuilder from '../../src/builder';
import { QueryOperator } from '../../src/types';

const builder = () => new QueryBuilder(false, false);

test('count comparisons', () => {
	const qb = builder();
	qb.countGreaterThan('Comments', 5)
		.countLessThan('Likes', 100)
		.countGreaterThanOrEqual('Shares', 50)
		.countLessThanOrEqual('Views', 200)
		.countEquals('Attachments', 3)
		.countNotEquals('Tags', 2);

	expect(qb.build()).toBe(
		[
			`Comments ${QueryOperator.CountGreaterThan} 5`,
			`Likes ${QueryOperator.CountLessThan} 100`,
			`Shares ${QueryOperator.CountGreaterThanOrEqual} 50`,
			`Views ${QueryOperator.CountLessThanOrEqual} 200`,
			`Attachments ${QueryOperator.CountEquals} 3`,
			`Tags ${QueryOperator.CountNotEquals} 2`,
		].join(' '),
	);
});
