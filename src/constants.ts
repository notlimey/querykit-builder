import { QueryOperator } from './types';

export const OPERATORS = Object.entries(QueryOperator).reduce(
	(acc, [key, value]) => {
		acc[value] = key;
		return acc;
	},
	{} as Record<QueryOperator, string>,
);
