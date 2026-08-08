import type { Maybe } from '../types';
import type {
	ArithExpr,
	ConditionExpr,
	LhsExpr,
	QueryExpr,
	RhsExpr,
} from './ast';
import { ParseError } from './parse-error';
import { type Token, tokenize } from './tokenizer';

const PROPERTY_PATH = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
const NUMBER = /^-?(\d+\.?\d*|\.\d+)$/;
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATETIME =
	/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?([+-]\d{2}:?\d{2}|Z)?)?$/i;
const TIME = /^\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?$/;

class Parser {
	private pos = 0;

	constructor(
		private readonly input: string,
		private readonly tokens: Token[],
	) {}

	public parse(): QueryExpr {
		const expr = this.parseOr();
		const trailing = this.peek();
		if (trailing) {
			throw this.error(
				`Unexpected "${describe(trailing)}" after end of expression — conditions must be joined with && or ||`,
				trailing,
			);
		}
		return expr;
	}

	private parseOr(): QueryExpr {
		let left = this.parseAnd();
		while (this.peek()?.type === 'or') {
			this.pos++;
			left = { type: 'or', left, right: this.parseAnd() };
		}
		return left;
	}

	private parseAnd(): QueryExpr {
		let left = this.parsePrimary();
		while (this.peek()?.type === 'and') {
			this.pos++;
			left = { type: 'and', left, right: this.parsePrimary() };
		}
		return left;
	}

	private parsePrimary(): QueryExpr {
		const token = this.peek();
		if (!token) {
			throw this.error('Expected a condition but reached the end');
		}

		if (token.type === 'lparen') {
			// `(` opens either a grouped logical expression or a condition
			// left-hand side (`(A, B) @= "x"`, `(Price * Quantity) > 0`).
			// Disambiguate by what follows the matching `)`.
			const close = this.matchingParen(this.pos);
			if (this.tokens[close + 1]?.type === 'op') {
				return this.parseCondition();
			}
			this.pos++;
			const expr = this.parseOr();
			this.expect('rparen', 'Expected ")"');
			return expr;
		}

		return this.parseCondition();
	}

	private parseCondition(): ConditionExpr {
		const lhs = this.parseLhs();
		const opToken = this.next();
		if (opToken?.type !== 'op') {
			throw this.error(
				'Expected a comparison operator',
				opToken ?? undefined,
			);
		}
		const rhs = this.parseRhs();
		return { type: 'condition', lhs, operator: opToken.value, rhs };
	}

	private parseLhs(): LhsExpr {
		const token = this.peek();
		if (token?.type === 'word') {
			this.pos++;
			return { kind: 'property', path: this.propertyPath(token) };
		}

		if (token?.type === 'lparen') {
			this.pos++;
			// `(A, B)` group when a comma follows the first path; otherwise
			// an arithmetic expression (which also covers `(Price)`).
			if (
				this.peek()?.type === 'word' &&
				this.tokens[this.pos + 1]?.type === 'comma'
			) {
				const paths: string[] = [];
				for (;;) {
					const word = this.next();
					if (word?.type !== 'word') {
						throw this.error(
							'Expected a property name in the group',
							word ?? undefined,
						);
					}
					paths.push(this.propertyPath(word));
					const separator = this.next();
					if (separator?.type === 'comma') continue;
					if (separator?.type === 'rparen') {
						return { kind: 'group', paths };
					}
					throw this.error(
						'Expected "," or ")" in the property group',
						separator ?? undefined,
					);
				}
			}

			const expr = this.parseArithExpr();
			this.expect('rparen', 'Expected ")" to close the expression');
			return expr.kind === 'property'
				? { kind: 'property', path: expr.path }
				: { kind: 'arith', expr };
		}

		throw this.error('Expected a property or "("', token ?? undefined);
	}

	private parseRhs(): RhsExpr {
		const token = this.next();
		if (!token) {
			throw this.error('Expected a value after the operator');
		}

		if (token.type === 'string') {
			return { kind: 'string', value: token.value };
		}

		if (token.type === 'lbracket') {
			const values: (string | number | boolean)[] = [];
			if (this.peek()?.type === 'rbracket') {
				this.pos++;
				return { kind: 'array', values };
			}
			for (;;) {
				const item = this.next();
				if (item?.type === 'string') {
					values.push(item.value);
				} else if (item?.type === 'word') {
					values.push(this.arrayValue(item));
				} else {
					throw this.error(
						'Expected a value in the array',
						item ?? undefined,
					);
				}
				const separator = this.next();
				if (separator?.type === 'comma') continue;
				if (separator?.type === 'rbracket') {
					return { kind: 'array', values };
				}
				throw this.error(
					'Expected "," or "]" in the array',
					separator ?? undefined,
				);
			}
		}

		if (token.type === 'lparen') {
			const expr = this.parseArithExpr();
			this.expect('rparen', 'Expected ")" to close the expression');
			return expr.kind === 'property'
				? { kind: 'property', path: expr.path }
				: { kind: 'arith', expr };
		}

		if (token.type === 'word') {
			return this.classifyWord(token);
		}

		throw this.error('Expected a value', token);
	}

	/** Mirrors QueryKit's unquoted-token classification order. */
	private classifyWord(token: Token & { type: 'word' }): RhsExpr {
		const { value } = token;
		if (value === 'null') return { kind: 'null' };
		if (value === 'true') return { kind: 'boolean', value: true };
		if (value === 'false') return { kind: 'boolean', value: false };
		if (GUID.test(value)) return { kind: 'guid', raw: value };
		if (DATETIME.test(value) || TIME.test(value)) {
			return { kind: 'datetime', raw: value };
		}
		if (NUMBER.test(value)) return { kind: 'number', value: Number(value) };
		if (PROPERTY_PATH.test(value)) {
			return { kind: 'property', path: value };
		}
		throw this.error(`"${value}" is not a valid value`, token);
	}

	private arrayValue(token: Token & { type: 'word' }): number | boolean {
		if (token.value === 'true') return true;
		if (token.value === 'false') return false;
		if (NUMBER.test(token.value)) return Number(token.value);
		throw this.error(
			`"${token.value}" is not a valid array value — strings must be quoted`,
			token,
		);
	}

	private parseArithExpr(): ArithExpr {
		let left = this.parseArithTerm();
		let token = this.peek();
		while (
			token?.type === 'arith' &&
			(token.value === '+' || token.value === '-')
		) {
			this.pos++;
			left = {
				kind: 'binary',
				op: token.value,
				left,
				right: this.parseArithTerm(),
			};
			token = this.peek();
		}
		return left;
	}

	private parseArithTerm(): ArithExpr {
		let left = this.parseArithFactor();
		let token = this.peek();
		while (
			token?.type === 'arith' &&
			(token.value === '*' || token.value === '/' || token.value === '%')
		) {
			this.pos++;
			left = {
				kind: 'binary',
				op: token.value,
				left,
				right: this.parseArithFactor(),
			};
			token = this.peek();
		}
		return left;
	}

	private parseArithFactor(): ArithExpr {
		const token = this.next();
		if (token?.type === 'lparen') {
			const expr = this.parseArithExpr();
			this.expect('rparen', 'Expected ")" in the arithmetic expression');
			return expr;
		}
		if (token?.type === 'word') {
			if (NUMBER.test(token.value)) {
				return { kind: 'number', value: Number(token.value) };
			}
			return { kind: 'property', path: this.propertyPath(token) };
		}
		throw this.error(
			'Expected a number, property or "(" in the arithmetic expression',
			token ?? undefined,
		);
	}

	private propertyPath(token: Token & { type: 'word' }): string {
		if (!PROPERTY_PATH.test(token.value)) {
			throw this.error(
				`"${token.value}" is not a valid property path`,
				token,
			);
		}
		return token.value;
	}

	/** Token index of the `)` matching the `(` at index `open`. */
	private matchingParen(open: number): number {
		let depth = 0;
		for (let i = open; i < this.tokens.length; i++) {
			const type = this.tokens[i].type;
			if (type === 'lparen') depth++;
			else if (type === 'rparen') {
				depth--;
				if (depth === 0) return i;
			}
		}
		throw this.error('Unmatched "("', this.tokens[open]);
	}

	private peek(): Token | undefined {
		return this.tokens[this.pos];
	}

	private next(): Token | undefined {
		return this.tokens[this.pos++];
	}

	private expect(type: Token['type'], message: string): Token {
		const token = this.next();
		if (token?.type !== type) {
			throw this.error(message, token ?? undefined);
		}
		return token;
	}

	private error(message: string, token?: Token): ParseError {
		return new ParseError(
			message,
			token?.pos ?? this.input.length,
			this.input,
		);
	}
}

function describe(token: Token): string {
	switch (token.type) {
		case 'string':
			return `"${token.value}"`;
		case 'word':
		case 'op':
		case 'arith':
			return token.value;
		case 'and':
			return '&&';
		case 'or':
			return '||';
		case 'lparen':
			return '(';
		case 'rparen':
			return ')';
		case 'lbracket':
			return '[';
		case 'rbracket':
			return ']';
		case 'comma':
			return ',';
	}
}

/**
 * Parses a QueryKit filter string into a {@link QueryExpr} tree. Accepts the
 * optional `Filters=` prefix. Returns `null` for empty input. Throws
 * {@link ParseError} (with a character position) on malformed input — use
 * {@link tryParseQuery} for a non-throwing variant.
 *
 * @example
 * parseQuery('(Title, Author.Name) @=* "king" && Rating > 4');
 * // { type: 'and',
 * //   left: { type: 'condition', lhs: { kind: 'group', paths: ['Title', 'Author.Name'] }, … },
 * //   right: { type: 'condition', lhs: { kind: 'property', path: 'Rating' }, … } }
 */
export function parseQuery(input: Maybe<string>): QueryExpr | null {
	if (!input) return null;
	// Blank out the prefix instead of slicing it off so ParseError positions
	// stay relative to the original input.
	const prefix = input.match(/^\s*Filters=\s*/)?.[0];
	const source = prefix
		? ' '.repeat(prefix.length) + input.slice(prefix.length)
		: input;
	const tokens = tokenize(source);
	if (tokens.length === 0) return null;
	return new Parser(source, tokens).parse();
}

export type ParseQueryResult =
	| { ok: true; ast: QueryExpr | null }
	| { ok: false; error: ParseError };

/** Non-throwing {@link parseQuery}. */
export function tryParseQuery(input: Maybe<string>): ParseQueryResult {
	try {
		return { ok: true, ast: parseQuery(input) };
	} catch (error) {
		if (error instanceof ParseError) return { ok: false, error };
		throw error;
	}
}
