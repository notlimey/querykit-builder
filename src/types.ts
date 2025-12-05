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
