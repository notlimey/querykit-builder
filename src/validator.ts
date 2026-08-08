import { tryParseQuery } from './parser/parser';

export type ValidationResult =
	| { valid: true }
	| { valid: false; errors: string[] };

/**
 * Validates a raw query string by actually parsing it (see `parseQuery`), so
 * it catches everything the parser does: unknown operators, missing values,
 * unbalanced parentheses, malformed arrays and unquoted string values. Error
 * messages include the character position. Empty input is valid.
 */
export function validateQuery(query: string): ValidationResult {
	const result = tryParseQuery(query);
	if (result.ok) return { valid: true };
	return {
		valid: false,
		errors: [
			`${result.error.message} (at position ${result.error.position})`,
		],
	};
}
