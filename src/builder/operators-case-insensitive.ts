import { CoreQueryBuilder } from './operators-core';
import { type Maybe, QueryOperator } from '../types';

export class CaseInsensitiveQueryBuilder extends CoreQueryBuilder {
	public equalsCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.EqualsCaseInsensitive, value);
	}

	public notEqualsCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.NotEqualsCaseInsensitive, value);
	}

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

	public hasCaseInsensitive(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.HasCaseInsensitive, value);
	}

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
}
