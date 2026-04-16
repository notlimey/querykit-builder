import { type Maybe, QueryOperator } from '../types';
import type { ArrayConditionToken, QueryToken } from './ast';

export interface QueryBuilderOptions {
	/**
	 * Whether to encode the resulting query string for use in a URI.
	 * Defaults to false.
	 */
	encodeUri?: boolean;
	/**
	 * Whether to add the "Filters= " prefix to the query.
	 * Defaults to false.
	 */
	addFilterStatement?: boolean;
}

/**
 * Base builder that handles query assembly and core helpers.
 */
export class BaseQueryBuilder {
	protected query: string;
	protected encodeURI: boolean;
	protected addFilterStatement: boolean;
	protected tokens: QueryToken[];

	constructor(
		encodeUri: boolean = false,
		addFilterStatement: boolean = false,
	) {
		this.query = '';
		this.encodeURI = encodeUri;
		this.addFilterStatement = addFilterStatement;
		this.tokens = [];
		if (addFilterStatement) {
			this.query += 'Filters= ';
			this.tokens.push({ type: 'raw', value: 'Filters=' });
		}
	}

	protected addCondition(condition: string): this {
		this.query += `${condition} `;
		return this;
	}

	protected stringifyValue(value: string | number | boolean): string {
		if (typeof value === 'string') {
			const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
			return `"${escaped}"`;
		}
		return value.toString();
	}

	protected op(
		property: string,
		operator: QueryOperator,
		value: Maybe<string | number | boolean>,
		forceQuote: boolean = false,
	): this {
		if (value === null || value === undefined) {
			return this;
		}
		const valStr = forceQuote
			? this.stringifyValue(String(value))
			: this.stringifyValue(value);
		this.tokens.push({
			type: 'condition',
			property,
			operator,
			value: value as string | number | boolean,
		});
		return this.addCondition(`${property} ${operator} ${valStr}`);
	}

	protected opArray(
		property: string,
		operator: QueryOperator,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		if (!values) return this;

		const validValues = values.filter(
			(val): val is string | number | boolean =>
				val !== null && val !== undefined,
		);
		if (validValues.length === 0) return this;

		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		this.tokens.push({
			type: 'conditionArray',
			property,
			operator,
			values: validValues,
		} satisfies ArrayConditionToken);
		return this.addCondition(`${property} ${operator} [${valueString}]`);
	}

	public append(
		query: string | BaseQueryBuilder,
		operator?: '&&' | '||',
	): this {
		let q = query instanceof BaseQueryBuilder ? query.query : query;
		if (!q.trim()) return this;

		if (q.startsWith('Filters=')) {
			q = q.replace(/^Filters=\s*/, '');
		}

		const current = this.query.trim();
		const endsWithOperator =
			current.endsWith('&&') || current.endsWith('||');

		if (
			operator &&
			current !== '' &&
			!current.endsWith('(') &&
			!endsWithOperator
		) {
			this.query = `${current} ${operator} `;
			this.tokens.push({ type: 'logical', operator });
		} else if (current !== '' && !current.endsWith('(')) {
			this.query = `${current} `;
		}

		this.query += q;
		this.tokens.push({ type: 'raw', value: q });
		return this;
	}

	public in(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		return this.opArray(property, QueryOperator.In, values);
	}

	public notIn(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		return this.opArray(property, QueryOperator.NotIn, values);
	}

	public and(): this {
		this.query = `${this.query.trim()} && `;
		this.tokens.push({ type: 'logical', operator: '&&' });
		return this;
	}

	public or(): this {
		this.query = `${this.query.trim()} || `;
		this.tokens.push({ type: 'logical', operator: '||' });
		return this;
	}

	public openParen(): this {
		this.query += '(';
		this.tokens.push({ type: 'paren', value: '(' });
		return this;
	}

	public closeParen(): this {
		this.query += ')';
		this.tokens.push({ type: 'paren', value: ')' });
		return this;
	}

	public concat(other: BaseQueryBuilder, operator?: '&&' | '||'): this {
		const currentTrimmed = this.query.trim();
		const shouldAddOperator = operator && currentTrimmed !== '';

		if (shouldAddOperator) {
			this.query = `${currentTrimmed} ${operator} `;
			this.tokens.push({ type: 'logical', operator });
		}

		let otherQuery = other.query.trim();

		if (otherQuery.startsWith('Filters=')) {
			otherQuery = otherQuery.replace(/^Filters=\s*/, '');
		}

		this.query += `(${otherQuery}) `;
		this.tokens.push({ type: 'raw', value: `(${otherQuery})` });
		return this;
	}

	public clone(): BaseQueryBuilder {
		const BuilderCtor = this.constructor as new (
			encodeUri?: boolean,
			addFilterStatement?: boolean,
		) => BaseQueryBuilder;
		const cloned = new BuilderCtor(this.encodeURI, this.addFilterStatement);
		cloned.query = this.query;
		cloned.tokens = [...this.tokens];
		return cloned;
	}

	public build(): string {
		let finalQuery = this.query.trim();

		if (finalQuery.endsWith('&&') || finalQuery.endsWith('||')) {
			finalQuery = finalQuery.replace(/(?:\s*(?:&&|\|\|))+$/, '').trim();
		}

		return this.encodeURI ? encodeURIComponent(finalQuery) : finalQuery;
	}

	public getTokens(): readonly QueryToken[] {
		return this.tokens;
	}
}
