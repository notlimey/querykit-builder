import type { ArithOperator, QueryOperator } from '../types';

/**
 * Parsed query tree. `&&` binds tighter than `||` (verified against
 * QueryKit's own parser), so `A || B && C` parses as `or(A, and(B, C))`.
 */
export type QueryExpr = LogicalExpr | ConditionExpr;

export interface LogicalExpr {
	type: 'and' | 'or';
	left: QueryExpr;
	right: QueryExpr;
}

export interface ConditionExpr {
	type: 'condition';
	lhs: LhsExpr;
	operator: QueryOperator;
	rhs: RhsExpr;
}

/** Left-hand side: a dot-path, a `(A, B)` group, or an arithmetic expression. */
export type LhsExpr =
	| { kind: 'property'; path: string }
	| { kind: 'group'; paths: string[] }
	| { kind: 'arith'; expr: ArithExpr };

/**
 * Right-hand side. Mirrors QueryKit's own classification of unquoted tokens:
 * `null` → guid → datetime → number → quoted string → array → property
 * reference. `datetime`/`guid` keep their raw text so they round-trip
 * byte-for-byte.
 */
export type RhsExpr =
	| { kind: 'string'; value: string }
	| { kind: 'number'; value: number }
	| { kind: 'boolean'; value: boolean }
	| { kind: 'null' }
	| { kind: 'guid'; raw: string }
	| { kind: 'datetime'; raw: string }
	| { kind: 'property'; path: string }
	| { kind: 'arith'; expr: ArithExpr }
	| { kind: 'array'; values: (string | number | boolean)[] };

/** Arithmetic tree; `*` `/` `%` bind tighter than `+` `-`. */
export type ArithExpr =
	| { kind: 'property'; path: string }
	| { kind: 'number'; value: number }
	| { kind: 'binary'; op: ArithOperator; left: ArithExpr; right: ArithExpr };
