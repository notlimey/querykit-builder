import type { LiteralValueFor } from '../paths';
import {
	type Maybe,
	type PropertyInput,
	QueryOperator,
	type StringValueInput,
	type ValueFor,
} from '../types';
import { CoreQueryBuilder } from './operators-core';

export class CaseInsensitiveQueryBuilder<
	T = unknown,
> extends CoreQueryBuilder<T> {
	public equalsCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.EqualsCaseInsensitive, value);
	}

	public notEqualsCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.NotEqualsCaseInsensitive, value);
	}

	public startsWithCaseInsensitive(
		property: PropertyInput<T>,
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
		property: PropertyInput<T>,
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
		property: PropertyInput<T>,
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
		property: PropertyInput<T>,
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
		property: PropertyInput<T>,
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
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotContainCaseInsensitive,
			value,
			true,
		);
	}

	public hasCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.HasCaseInsensitive, value);
	}

	public doesNotHaveCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(
			property,
			QueryOperator.DoesNotHaveCaseInsensitive,
			value,
		);
	}

	public inCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		values: Maybe<Maybe<LiteralValueFor<T, NoInfer<P>>>[]>,
	): this {
		return this.opArray(property, QueryOperator.InCaseInsensitive, values);
	}

	public notInCaseInsensitive<P extends PropertyInput<T>>(
		property: P,
		values: Maybe<Maybe<LiteralValueFor<T, NoInfer<P>>>[]>,
	): this {
		return this.opArray(
			property,
			QueryOperator.NotInCaseInsensitive,
			values,
		);
	}
}
