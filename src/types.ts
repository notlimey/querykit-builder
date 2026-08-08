import type { LiteralValueFor, PropertyPath } from './paths';

export enum QueryOperator {
	Equals = '==',
	NotEquals = '!=',
	GreaterThan = '>',
	LessThan = '<',
	GreaterThanOrEqual = '>=',
	LessThanOrEqual = '<=',
	StartsWith = '_=',
	DoesNotStartWith = '!_=',
	EndsWith = '_-=',
	DoesNotEndWith = '!_-=',
	Contains = '@=',
	DoesNotContain = '!@=',
	SoundsLike = '~~',
	DoesNotSoundLike = '!~',
	Has = '^$',
	DoesNotHave = '!^$',
	In = '^^',
	NotIn = '!^^',

	// Case Insensitive
	EqualsCaseInsensitive = '==*',
	NotEqualsCaseInsensitive = '!=*',
	StartsWithCaseInsensitive = '_=*',
	DoesNotStartWithCaseInsensitive = '!_=*',
	EndsWithCaseInsensitive = '_-=*',
	DoesNotEndWithCaseInsensitive = '!_-=*',
	ContainsCaseInsensitive = '@=*',
	DoesNotContainCaseInsensitive = '!@=*',
	HasCaseInsensitive = '^$*',
	DoesNotHaveCaseInsensitive = '!^$*',
	InCaseInsensitive = '^^*',
	NotInCaseInsensitive = '!^^*',

	// Count
	CountGreaterThan = '#>',
	CountLessThan = '#<',
	CountGreaterThanOrEqual = '#>=',
	CountLessThanOrEqual = '#<=',
	CountEquals = '#==',
	CountNotEquals = '#!=',
}

export type Maybe<T> = T | null | undefined;

/** A plain, quotable filter value. */
export type FilterValue = string | number | boolean;

/**
 * Reference to a property on the entity rather than a literal value.
 * Created with `prop()`; rendered unquoted so QueryKit performs a
 * property-to-property comparison.
 */
export type PropertyRef = {
	readonly __querykit: 'property';
	readonly name: string;
};

/**
 * A parenthesized arithmetic expression such as `(Price * Quantity)`.
 * Created with `arith()`.
 */
export type ArithExpression = {
	readonly __querykit: 'arith';
	readonly expression: string;
};

export type ArithOperator = '+' | '-' | '*' | '/' | '%';

/**
 * Anything accepted as the left-hand side of a condition. With the default
 * `T = unknown` any string is accepted; a typed builder narrows it to the
 * entity's dot-paths. `prop()` stays untyped as the dynamic-name escape hatch.
 */
export type PropertyInput<T = unknown> =
	| PropertyPath<T>
	| readonly PropertyPath<T>[]
	| PropertyRef
	| ArithExpression;

/** Anything accepted as the right-hand side of a condition. */
export type ValueInput = FilterValue | PropertyRef | ArithExpression;

/**
 * The right-hand side a typed builder accepts for the given property input:
 * the value type at that path (see `PathValue`), or a `prop()`/`arith()`
 * reference. Collapses to `ValueInput` on untyped builders.
 */
export type ValueFor<T, P> =
	| LiteralValueFor<T, P>
	| PropertyRef
	| ArithExpression;

/** Right-hand side for string-only operators (contains, startsWith, ...). */
export type StringValueInput = string | PropertyRef | ArithExpression;
