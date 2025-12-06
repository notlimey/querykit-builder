import { QueryOperator } from './types';

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

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
				parenStack.push(token);
				continue;
			}

			if (isCondition(i)) {
				i += 2; // skip property/operator/value
				expectCondition = false;
				continue;
			}

			errors.push(`Expected condition at token ${i + 1}, found "${token}"`);
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

		errors.push(`Expected "&&" or "||" at token ${i + 1}, found "${token}"`);
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
