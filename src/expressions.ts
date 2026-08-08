import type {
	ArithExpression,
	ArithOperator,
	PropertyInput,
	PropertyRef,
	ValueInput,
} from './types';

const ARITH_OPERATORS = new Set<string>(['+', '-', '*', '/', '%']);

/**
 * Marks a value as a property name so it is rendered unquoted, producing a
 * property-to-property comparison.
 *
 * @example
 * new QueryBuilder().equals('FirstName', prop('LastName')).build();
 * // FirstName == LastName
 */
export function prop(name: string): PropertyRef {
	return { __querykit: 'property', name };
}

export function isPropertyRef(value: unknown): value is PropertyRef {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as PropertyRef).__querykit === 'property'
	);
}

export function isArithExpression(value: unknown): value is ArithExpression {
	return (
		typeof value === 'object' &&
		value !== null &&
		(value as ArithExpression).__querykit === 'arith'
	);
}

export type ArithOperand = string | number | PropertyRef | ArithExpression;
export type ArithPart = ArithOperand | ArithOperator;

/**
 * Builds a parenthesized arithmetic expression. Parts alternate between
 * operands and arithmetic operators. Bare strings are treated as property
 * names, numbers as literals, and nested `arith()` results keep their parens.
 *
 * @example
 * arith('Price', '*', 'Quantity'); // (Price * Quantity)
 * arith('Total', '/', arith('Count', '+', 1)); // (Total / (Count + 1))
 */
export function arith(...parts: ArithPart[]): ArithExpression {
	if (parts.length < 3 || parts.length % 2 === 0) {
		throw new Error(
			'arith() expects alternating operands and operators, e.g. arith("Age", "+", "Rating")',
		);
	}

	const rendered = parts.map((part, index) => {
		const expectsOperator = index % 2 === 1;

		if (expectsOperator) {
			if (typeof part !== 'string' || !ARITH_OPERATORS.has(part)) {
				throw new Error(
					`arith() expected an arithmetic operator (+ - * / %) at position ${index}, received "${String(part)}"`,
				);
			}
			return part;
		}

		if (typeof part === 'string' || typeof part === 'number') {
			if (ARITH_OPERATORS.has(part as string)) {
				throw new Error(
					`arith() expected an operand at position ${index}, received the operator "${String(part)}"`,
				);
			}
			return String(part);
		}
		if (isPropertyRef(part)) return part.name;
		if (isArithExpression(part)) return part.expression;

		throw new Error(
			`arith() received an unsupported operand at position ${index}`,
		);
	});

	return { __querykit: 'arith', expression: `(${rendered.join(' ')})` };
}

/** Renders the left-hand side of a condition. */
export function renderProperty(property: PropertyInput): string {
	if (Array.isArray(property)) {
		const properties = property as readonly string[];
		if (properties.length === 0) {
			throw new Error(
				'Property list grouping requires at least one property',
			);
		}
		return `(${properties.join(', ')})`;
	}
	if (isPropertyRef(property)) return property.name;
	if (isArithExpression(property)) return property.expression;
	return property as string;
}

/** Returns the property list when grouping syntax was used. */
export function propertyList(property: PropertyInput): string[] | undefined {
	return Array.isArray(property)
		? [...(property as readonly string[])]
		: undefined;
}

/** True when the value should be rendered unquoted (property/arithmetic). */
export function isUnquotedValue(
	value: ValueInput,
): value is PropertyRef | ArithExpression {
	return isPropertyRef(value) || isArithExpression(value);
}

/** Renders the right-hand side of a condition when it is not a literal. */
export function renderUnquotedValue(
	value: PropertyRef | ArithExpression,
): string {
	return isPropertyRef(value) ? value.name : value.expression;
}
