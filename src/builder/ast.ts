import type { QueryOperator } from '../types';

export type QueryToken =
	| ConditionToken
	| ArrayConditionToken
	| LogicalToken
	| ParenToken
	| RawToken;

export type ConditionToken = {
	type: 'condition';
	property: string;
	operator: QueryOperator;
	value: string | number | boolean;
};

export type ArrayConditionToken = {
	type: 'conditionArray';
	property: string;
	operator: QueryOperator;
	values: (string | number | boolean)[];
};

export type LogicalToken = {
	type: 'logical';
	operator: '&&' | '||';
};

export type ParenToken = {
	type: 'paren';
	value: '(' | ')';
};

export type RawToken = {
	type: 'raw';
	value: string;
};
