import { type Maybe, QueryOperator } from './types';

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
 * A builder for creating query strings.
 */
export default class QueryBuilder {
	private query: string;
	private encodeURI: boolean;

	/**
	 * Creates a new instance of the QueryBuilder.
	 * @param encodeUri Whether to encode the resulting query string for use in a URI. Defaults to false.
	 * @param addFilterStatement Whether to add the "Filters= " prefix to the query. Defaults to false.
	 */
	constructor(
		encodeUri: boolean = false,
		addFilterStatement: boolean = false,
	) {
		this.query = '';
		this.encodeURI = encodeUri;
		if (addFilterStatement) {
			this.query += 'Filters= ';
		}
	}

	/**
	 * Adds a condition to the query.
	 * @param condition The condition to add.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public addCondition(condition: string): this {
		this.query += `${condition} `;
		return this;
	}

	/**
	 * Stringifies a value for use in the query.
	 * @param value The value to stringify.
	 * @returns The stringified value.
	 */
	private stringifyValue(value: string | number | boolean): string {
		if (typeof value === 'string') {
			const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
			return `"${escaped}"`;
		}
		return value.toString();
	}

	/**
	 * Adds a generic operation to the query.
	 * @param property The property to operate on.
	 * @param operator The query operator.
	 * @param value The value for the operation.
	 * @param forceQuote Whether to force quoting of the value.
	 * @returns The QueryBuilder instance for chaining.
	 */
	private op(
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
		return this.addCondition(`${property} ${operator} ${valStr}`);
	}

	/**
	 * Adds an "equals" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public equals(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.Equals, value);
	}
	/**
	 * Adds a "not equals" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public notEquals(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.NotEquals, value);
	}
	/**
	 * Adds a "greater than" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public greaterThan(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.GreaterThan, value);
	}

	/**
	 * Appends a raw query string or another QueryBuilder's query to this builder.
	 * @param query The query string or QueryBuilder to append.
	 * @param operator The logical operator to use for joining ('&&' or '||').
	 * @returns The QueryBuilder instance for chaining.
	 */
	public append(query: string | QueryBuilder, operator?: '&&' | '||'): this {
		let q = query instanceof QueryBuilder ? query.query : query;

		// Don't append if the query to append is empty
		if (!q.trim()) {
			return this;
		}

		// If the other query has a filter statement, remove it
		if (q.startsWith('Filters=')) {
			q = q.replace(/^Filters=\s*/, '');
		}

		const currentTrimmed = this.query.trim();
		const endsWithOperator =
			currentTrimmed.endsWith('&&') || currentTrimmed.endsWith('||');
		const shouldAddOperator =
			operator &&
			currentTrimmed !== '' &&
			currentTrimmed !== 'Filters=' &&
			!currentTrimmed.endsWith('(') &&
			!endsWithOperator;

		if (shouldAddOperator) {
			this.query = `${currentTrimmed} ${operator} `;
		} else if (
			currentTrimmed !== '' &&
			currentTrimmed !== 'Filters=' &&
			!currentTrimmed.endsWith('(')
		) {
			this.query = `${currentTrimmed} `;
		}

		this.query += q;
		return this;
	}
	/**
	 * Adds a "less than" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public lessThan(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.LessThan, value);
	}
	/**
	 * Adds a "greater than or equal" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public greaterThanOrEqual(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.GreaterThanOrEqual, value);
	}
	/**
	 * Adds a "less than or equal" condition.
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public lessThanOrEqual(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.LessThanOrEqual, value);
	}

	/**
	 * Adds a "starts with" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public startsWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.StartsWith, value, true);
	}
	/**
	 * Adds a "does not start with" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotStartWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotStartWith, value, true);
	}
	/**
	 * Adds an "ends with" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public endsWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.EndsWith, value, true);
	}
	/**
	 * Adds a "does not end with" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotEndWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotEndWith, value, true);
	}
	/**
	 * Adds a "contains" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public contains(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.Contains, value, true);
	}
	/**
	 * Adds a "does not contain" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotContain(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotContain, value, true);
	}
	/**
	 * Adds a "sounds like" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public soundsLike(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.SoundsLike, value, true);
	}
	/**
	 * Adds a "does not sound like" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotSoundLike(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotSoundLike, value, true);
	}

	/**
	 * Adds a "has" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public has(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.Has, value);
	}
	/**
	 * Adds a "does not have" condition.
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotHave(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.DoesNotHave, value);
	}

	/**
	 * Adds an "in" condition.
	 * @param property The property to check.
	 * @param values The values to check against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public in(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		if (!values) {
			return this;
		}
		const validValues = values.filter(
			(val) => val !== null && val !== undefined,
		) as (string | number | boolean)[];

		if (validValues.length === 0) {
			return this;
		}

		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		return this.addCondition(
			`${property} ${QueryOperator.In} [${valueString}]`,
		);
	}

	/**
	 * Adds a "not in" condition.
	 * @param property The property to check.
	 * @param values The values to check against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public notIn(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		if (!values) {
			return this;
		}
		const validValues = values.filter(
			(val) => val !== null && val !== undefined,
		) as (string | number | boolean)[];

		if (validValues.length === 0) {
			return this;
		}

		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		return this.addCondition(
			`${property} ${QueryOperator.NotIn} [${valueString}]`,
		);
	}

	/**
	 * Adds an "equals" condition (case-insensitive).
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public equalsCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.EqualsCaseInsensitive, value);
	}
	/**
	 * Adds a "not equals" condition (case-insensitive).
	 * @param property The property to compare.
	 * @param value The value to compare against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public notEqualsCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.NotEqualsCaseInsensitive, value);
	}
	/**
	 * Adds a "starts with" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public startsWithCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.StartsWithCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds a "does not start with" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotStartWithCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotStartWithCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds an "ends with" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public endsWithCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.EndsWithCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds a "does not end with" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotEndWithCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotEndWithCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds a "contains" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public containsCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.ContainsCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds a "does not contain" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotContainCaseInsensitive(
		property: string,
		value: Maybe<string>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotContainCaseInsensitive,
			value,
			true,
		);
	}
	/**
	 * Adds a "has" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public hasCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.HasCaseInsensitive, value);
	}
	/**
	 * Adds a "does not have" condition (case-insensitive).
	 * @param property The property to check.
	 * @param value The value to check for.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public doesNotHaveCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotHaveCaseInsensitive,
			value,
		);
	}

	/**
	 * Adds an "in" condition (case-insensitive).
	 * @param property The property to check.
	 * @param values The values to check against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public inCaseInsensitive(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		if (!values) {
			return this;
		}
		const validValues = values.filter(
			(val) => val !== null && val !== undefined,
		) as (string | number | boolean)[];

		if (validValues.length === 0) {
			return this;
		}

		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		return this.addCondition(
			`${property} ${QueryOperator.InCaseInsensitive} [${valueString}]`,
		);
	}

	/**
	 * Adds a "not in" condition (case-insensitive).
	 * @param property The property to check.
	 * @param values The values to check against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public notInCaseInsensitive(
		property: string,
		values: Maybe<Maybe<string | number | boolean>[]>,
	): this {
		if (!values) {
			return this;
		}
		const validValues = values.filter(
			(val) => val !== null && val !== undefined,
		) as (string | number | boolean)[];

		if (validValues.length === 0) {
			return this;
		}

		const valueString = validValues
			.map((val) => this.stringifyValue(val))
			.join(',');
		return this.addCondition(
			`${property} ${QueryOperator.NotInCaseInsensitive} [${valueString}]`,
		);
	}

	/**
	 * Adds an "and" logical operator.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public and(): this {
		this.query = `${this.query.trim()} && `;
		return this;
	}
	/**
	 * Adds an "or" logical operator.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public or(): this {
		this.query = `${this.query.trim()} || `;
		return this;
	}
	/**
	 * Adds an opening parenthesis.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public openParen(): this {
		this.query += '(';
		return this;
	}
	/**
	 * Adds a closing parenthesis.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public closeParen(): this {
		this.query += ')';
		return this;
	}

	/**
	 * Concatenates another QueryBuilder to this one.
	 * @param other The other QueryBuilder to concatenate.
	 * @param operator The logical operator to use for concatenation ('&&' or '||').
	 * @returns The QueryBuilder instance for chaining.
	 */
	public concat(other: QueryBuilder, operator?: '&&' | '||'): this {
		const currentTrimmed = this.query.trim();
		const shouldAddOperator =
			operator && currentTrimmed !== '' && currentTrimmed !== 'Filters=';

		if (shouldAddOperator) {
			this.query = `${currentTrimmed} ${operator} `;
		}

		let otherQuery = other.query.trim();

		if (otherQuery.startsWith('Filters=')) {
			otherQuery = otherQuery.replace(/^Filters=\s*/, '');
		}

		// Wrap the concatenated query in parentheses
		this.query += `(${otherQuery}) `;
		return this;
	}

	/**
	 * Creates a clone of the current QueryBuilder instance.
	 * @returns A new QueryBuilder instance with the same query.
	 */
	public clone(): QueryBuilder {
		const cloned = new QueryBuilder(this.encodeURI, false);
		cloned.query = this.query;
		return cloned;
	}

	/**
	 * Adds a "count greater than" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countGreaterThan(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountGreaterThan, value);
	}
	/**
	 * Adds a "count less than" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countLessThan(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThan, value);
	}
	/**
	 * Adds a "count greater than or equal" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countGreaterThanOrEqual(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThanOrEqual, value);
	}
	/**
	 * Adds a "count less than or equal" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countLessThanOrEqual(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThanOrEqual, value);
	}

	/**
	 * Adds a "count equals" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public equalsCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountEquals, value);
	}
	/**
	 * Adds a "count not equals" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public notEqualsCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountNotEquals, value);
	}
	/**
	 * Adds a "count greater than" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public greaterThanCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountGreaterThan, value);
	}
	/**
	 * Adds a "count less than" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public lessThanCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThan, value);
	}
	/**
	 * Adds a "count greater than or equal" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public greaterThanOrEqualCaseCount(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThanOrEqual, value);
	}
	/**
	 * Adds a "count less than or equal" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public lessThanOrEqualCaseCount(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountLessThanOrEqual, value);
	}

	/**
	 * Adds a "count equals" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countEquals(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountEquals, value);
	}
	/**
	 * Adds a "count not equals" condition.
	 * @param property The property to count.
	 * @param value The value to compare the count against.
	 * @returns The QueryBuilder instance for chaining.
	 */
	public countNotEquals(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountNotEquals, value);
	}

	/**
	 * Builds the final query string.
	 * @returns The completed query string.
	 */
	public build(): string {
		let finalQuery = this.query.trim();

		// Drop trailing logical operators that were left after skipped conditions
		if (finalQuery.endsWith('&&') || finalQuery.endsWith('||')) {
			finalQuery = finalQuery.replace(/(?:\s*(?:&&|\|\|))+$/, '').trim();
		}

		return this.encodeURI ? encodeURIComponent(finalQuery) : finalQuery;
	}
}
