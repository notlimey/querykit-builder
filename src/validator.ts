import { QueryOperator } from './types';

export type ValidationResult =
	| { valid: true }
	| { valid: false; errors: string[] };

const logicalOperators = new Set(['&&', '||']);
const operators = new Set(Object.values(QueryOperator));

/**
 * Validates a raw query string for basic structural correctness:
 * - Balanced parentheses
 * - Alternating conditions and logical operators
 * - Known operators
 */
export function validateQuery(query: string): ValidationResult {
	const errors: string[] = [];
	const trimmed = query.trim().replace(/^Filters=\s*/, '');
	if (!trimmed) return { valid: true };

	const tokens =
		trimmed.match(/"([^"\\]|\\.)*"|\(|\)|&&|\|\||[^\s()]+/g) ?? [];

	const parenStack: string[] = [];
	let expectCondition = true;

	/** Index of the `)` matching the `(` at `start`, or -1 when unbalanced. */
	const matchingParen = (start: number) => {
		let depth = 0;
		for (let i = start; i < tokens.length; i++) {
			if (tokens[i] === '(') depth++;
			else if (tokens[i] === ')') {
				depth--;
				if (depth === 0) return i;
			}
		}
		return -1;
	};

	/**
	 * A parenthesized span is a left-hand side (property list grouping or an
	 * arithmetic expression) when it contains no comparison/logical operators
	 * and is immediately followed by a comparison operator.
	 */
	const isPropertyExpression = (open: number, close: number) => {
		const next = tokens[close + 1];
		if (next === undefined || !operators.has(next as QueryOperator)) {
			return false;
		}
		return !tokens
			.slice(open + 1, close)
			.some(
				(token) =>
					logicalOperators.has(token) ||
					operators.has(token as QueryOperator),
			);
	};

	const isCondition = (idx: number) => {
		const prop = tokens[idx];
		const op = tokens[idx + 1];
		const val = tokens[idx + 2];
		return (
			prop !== undefined &&
			op !== undefined &&
			val !== undefined &&
			!logicalOperators.has(prop) &&
			prop !== '(' &&
			prop !== ')' &&
			operators.has(op as QueryOperator)
		);
	};

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (expectCondition) {
			if (token === '(') {
				const close = matchingParen(i);
				if (close !== -1 && isPropertyExpression(i, close)) {
					if (tokens[close + 2] === undefined) {
						errors.push(
							`Missing value after operator at token ${close + 2}`,
						);
						break;
					}
					i = close + 2; // skip (property expression) operator value
					expectCondition = false;
					continue;
				}

				parenStack.push(token);
				continue;
			}

			if (isCondition(i)) {
				i += 2; // skip property/operator/value
				expectCondition = false;
				continue;
			}

			errors.push(
				`Expected condition at token ${i + 1}, found "${token}"`,
			);
			break;
		}

		// Expecting logical operator or closing paren
		if (logicalOperators.has(token)) {
			expectCondition = true;
			continue;
		}

		if (token === ')') {
			if (parenStack.length === 0) {
				errors.push(`Unmatched closing parenthesis at token ${i + 1}`);
				break;
			}
			parenStack.pop();
			continue;
		}

		errors.push(
			`Expected "&&" or "||" at token ${i + 1}, found "${token}"`,
		);
		break;
	}

	if (expectCondition) {
		errors.push('Query ends with a logical operator');
	}

	if (parenStack.length > 0) {
		errors.push('Unmatched opening parenthesis');
	}

	return errors.length ? { valid: false, errors } : { valid: true };
}
