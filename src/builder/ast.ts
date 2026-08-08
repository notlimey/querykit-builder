import type {
	ArithExpression,
	FilterValue,
	PropertyRef,
	QueryOperator,
} from '../types';

export type QueryToken =
	| ConditionToken
	| ArrayConditionToken
	| NullConditionToken
	| LogicalToken
	| ParenToken
	| RawToken;

export type ConditionToken = {
	type: 'condition';
	/** Rendered left-hand side, e.g. `Title`, `(Title, Author.Name)`, `(Price * Quantity)`. */
	property: string;
	/** Present only when property list grouping was used. */
	properties?: string[];
	operator: QueryOperator;
	value: FilterValue | PropertyRef | ArithExpression;
};

export type ArrayConditionToken = {
	type: 'conditionArray';
	property: string;
	properties?: string[];
	operator: QueryOperator;
	values: FilterValue[];
};

export type NullConditionToken = {
	type: 'nullCondition';
	property: string;
	properties?: string[];
	/** `==` for `isNull`, `!=` for `isNotNull`. */
	operator: QueryOperator;
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
