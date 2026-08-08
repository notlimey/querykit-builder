import { type ArithOperator, QueryOperator } from '../types';
import { ParseError } from './parse-error';

export type Token =
	| {
			type: 'lparen' | 'rparen' | 'lbracket' | 'rbracket' | 'comma';
			pos: number;
	  }
	| { type: 'and' | 'or'; pos: number }
	| { type: 'op'; value: QueryOperator; pos: number }
	| { type: 'arith'; value: ArithOperator; pos: number }
	| { type: 'string'; value: string; pos: number }
	| { type: 'word'; value: string; pos: number };

/** Longest first, so `!_-=*` wins over `!_-=`, `>=` over `>`, `~~` over `~`. */
const OPERATORS = (Object.values(QueryOperator) as string[]).sort(
	(a, b) => b.length - a.length,
);

const STRUCTURAL: Record<
	string,
	'lparen' | 'rparen' | 'lbracket' | 'rbracket' | 'comma'
> = {
	'(': 'lparen',
	')': 'rparen',
	'[': 'lbracket',
	']': 'rbracket',
	',': 'comma',
};

const ARITH_CHARS = new Set(['+', '-', '*', '/', '%']);

function matchOperatorAt(input: string, index: number): QueryOperator | null {
	for (const op of OPERATORS) {
		if (input.startsWith(op, index)) return op as QueryOperator;
	}
	return null;
}

function isWordBoundary(input: string, index: number): boolean {
	const char = input[index];
	return (
		/\s/.test(char) ||
		char === '"' ||
		char in STRUCTURAL ||
		input.startsWith('&&', index) ||
		input.startsWith('||', index) ||
		matchOperatorAt(input, index) !== null
	);
}

function scanString(
	input: string,
	start: number,
): { value: string; end: number } {
	// Raw string literal: """…""" with no escaping, matching QueryKit.
	if (input.startsWith('"""', start)) {
		const close = input.indexOf('"""', start + 3);
		if (close === -1) {
			throw new ParseError(
				'Unterminated raw string literal',
				start,
				input,
			);
		}
		return { value: input.slice(start + 3, close), end: close + 3 };
	}

	let value = '';
	let i = start + 1;
	while (i < input.length) {
		const char = input[i];
		if (char === '\\') {
			const next = input[i + 1];
			if (next === '"' || next === '\\') {
				value += next;
				i += 2;
				continue;
			}
			value += char;
			i++;
			continue;
		}
		if (char === '"') return { value, end: i + 1 };
		value += char;
		i++;
	}
	throw new ParseError('Unterminated string literal', start, input);
}

/**
 * Splits a query into tokens. Comparison operators use longest-match, and a
 * word only breaks where a full operator actually matches — so `A_B` stays one
 * word even though `_=` is an operator. Arithmetic operators are recognized at
 * token starts only, which keeps `-` usable inside dates (`2022-07-01`) and
 * signed numbers; arithmetic therefore needs spaces (`Price * Quantity`),
 * which is exactly what `arith()` emits.
 */
export function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < input.length) {
		const char = input[i];

		if (/\s/.test(char)) {
			i++;
			continue;
		}

		if (char in STRUCTURAL) {
			tokens.push({ type: STRUCTURAL[char], pos: i });
			i++;
			continue;
		}

		if (char === '"') {
			const { value, end } = scanString(input, i);
			tokens.push({ type: 'string', value, pos: i });
			i = end;
			continue;
		}

		if (input.startsWith('&&', i)) {
			tokens.push({ type: 'and', pos: i });
			i += 2;
			continue;
		}
		if (input.startsWith('||', i)) {
			tokens.push({ type: 'or', pos: i });
			i += 2;
			continue;
		}

		const operator = matchOperatorAt(input, i);
		if (operator) {
			tokens.push({ type: 'op', value: operator, pos: i });
			i += operator.length;
			continue;
		}

		if (ARITH_CHARS.has(char)) {
			// `-5` / `-.5` is a signed number, not a subtraction.
			const isSignedNumber =
				char === '-' && /[\d.]/.test(input[i + 1] ?? '');
			if (!isSignedNumber) {
				tokens.push({
					type: 'arith',
					value: char as ArithOperator,
					pos: i,
				});
				i++;
				continue;
			}
		}

		const start = i;
		i++; // first char is part of the word even if it is `-`
		while (i < input.length && !isWordBoundary(input, i)) i++;
		tokens.push({ type: 'word', value: input.slice(start, i), pos: start });
	}

	return tokens;
}
