import {
	type FilterValue,
	type Maybe,
	type PropertyInput,
	QueryOperator,
	type StringValueInput,
	type ValueInput,
} from '../types';
import { CoreQueryBuilder } from './operators-core';

export class CaseInsensitiveQueryBuilder extends CoreQueryBuilder {
	public equalsCaseInsensitive(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.EqualsCaseInsensitive, value);
	}

	public notEqualsCaseInsensitive(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.NotEqualsCaseInsensitive, value);
	}

	public startsWithCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.StartsWithCaseInsensitive,
			value,
			true,
		);
	}

	public doesNotStartWithCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotStartWithCaseInsensitive,
			value,
			true,
		);
	}

	public endsWithCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.EndsWithCaseInsensitive,
			value,
			true,
		);
	}

	public doesNotEndWithCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotEndWithCaseInsensitive,
			value,
			true,
		);
	}

	public containsCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.ContainsCaseInsensitive,
			value,
			true,
		);
	}

	public doesNotContainCaseInsensitive(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotContainCaseInsensitive,
			value,
			true,
		);
	}

	public hasCaseInsensitive(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.HasCaseInsensitive, value);
	}

	public doesNotHaveCaseInsensitive(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotHaveCaseInsensitive,
			value,
		);
	}

	public inCaseInsensitive(
		property: PropertyInput,
		values: Maybe<Maybe<FilterValue>[]>,
	): this {
		return this.opArray(property, QueryOperator.InCaseInsensitive, values);
	}

	public notInCaseInsensitive(
		property: PropertyInput,
		values: Maybe<Maybe<FilterValue>[]>,
	): this {
		return this.opArray(
			property,
			QueryOperator.NotInCaseInsensitive,
			values,
		);
	}
}
