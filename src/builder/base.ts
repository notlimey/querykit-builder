import {
	isUnquotedValue,
	propertyList,
	renderProperty,
	renderUnquotedValue,
} from '../expressions';
import type { LiteralValueFor } from '../paths';
import {
	type FilterValue,
	type Maybe,
	type PropertyInput,
	QueryOperator,
	type ValueInput,
} from '../types';
import type {
	ArrayConditionToken,
	ConditionToken,
	NullConditionToken,
	QueryToken,
} from './ast';

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
export class BaseQueryBuilder<T = unknown> {
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
		property: PropertyInput<T>,
		operator: QueryOperator,
		value: Maybe<ValueInput>,
		forceQuote: boolean = false,
	): this {
		if (value === null || value === undefined) {
			return this;
		}

		const propertyText = renderProperty(property);
		const properties = propertyList(property);
		const valStr = isUnquotedValue(value)
			? renderUnquotedValue(value)
			: forceQuote
				? this.stringifyValue(String(value))
				: this.stringifyValue(value);

		this.tokens.push({
			type: 'condition',
			property: propertyText,
			...(properties ? { properties } : {}),
			operator,
			value,
		} satisfies ConditionToken);
		return this.addCondition(`${propertyText} ${operator} ${valStr}`);
	}

	protected opArray(
		property: PropertyInput<T>,
		operator: QueryOperator,
		values: Maybe<Maybe<FilterValue>[]>,
	): this {
		if (!values) return this;

		const validValues = values.filter(
			(val): val is FilterValue => val !== null && val !== undefined,
		);
		if (validValues.length === 0) return this;

		const propertyText = renderProperty(property);
		const properties = propertyList(property);
		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		this.tokens.push({
			type: 'conditionArray',
			property: propertyText,
			...(properties ? { properties } : {}),
			operator,
			values: validValues,
		} satisfies ArrayConditionToken);
		return this.addCondition(
			`${propertyText} ${operator} [${valueString}]`,
		);
	}

	/**
	 * Emits an explicit null check, e.g. `DeletedAt == null`.
	 * Passing `null`/`undefined` to a normal operator stays a no-op so optional
	 * filters keep chaining cleanly — use this when you mean "is null".
	 */
	public isNull(property: PropertyInput<T>): this {
		return this.nullCheck(property, QueryOperator.Equals);
	}

	/** Emits an explicit not-null check, e.g. `Author.Email != null`. */
	public isNotNull(property: PropertyInput<T>): this {
		return this.nullCheck(property, QueryOperator.NotEquals);
	}

	private nullCheck(
		property: PropertyInput<T>,
		operator: QueryOperator.Equals | QueryOperator.NotEquals,
	): this {
		const propertyText = renderProperty(property);
		const properties = propertyList(property);
		this.tokens.push({
			type: 'nullCondition',
			property: propertyText,
			...(properties ? { properties } : {}),
			operator,
		} satisfies NullConditionToken);
		return this.addCondition(`${propertyText} ${operator} null`);
	}

	public append(
		query: string | BaseQueryBuilder<never>,
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

	public in<P extends PropertyInput<T>>(
		property: P,
		values: Maybe<Maybe<LiteralValueFor<T, NoInfer<P>>>[]>,
	): this {
		return this.opArray(property, QueryOperator.In, values);
	}

	public notIn<P extends PropertyInput<T>>(
		property: P,
		values: Maybe<Maybe<LiteralValueFor<T, NoInfer<P>>>[]>,
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
		this.query = `${this.query.replace(/\s+$/, '')})`;
		this.tokens.push({ type: 'paren', value: ')' });
		return this;
	}

	public concat(
		other: BaseQueryBuilder<never>,
		operator?: '&&' | '||',
	): this {
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

	public clone(): BaseQueryBuilder<T> {
		const BuilderCtor = this.constructor as new (
			encodeUri?: boolean,
			addFilterStatement?: boolean,
		) => BaseQueryBuilder<T>;
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
