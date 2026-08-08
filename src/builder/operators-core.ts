import {
	type Maybe,
	type PropertyInput,
	QueryOperator,
	type StringValueInput,
	type ValueFor,
} from '../types';
import { BaseQueryBuilder } from './base';

export class CoreQueryBuilder<T = unknown> extends BaseQueryBuilder<T> {
	public equals<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.Equals, value);
	}

	public notEquals<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.NotEquals, value);
	}

	public greaterThan<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.GreaterThan, value);
	}

	public lessThan<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.LessThan, value);
	}

	public greaterThanOrEqual<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.GreaterThanOrEqual, value);
	}

	public lessThanOrEqual<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.LessThanOrEqual, value);
	}

	public startsWith(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.StartsWith, value, true);
	}

	public doesNotStartWith(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotStartWith, value, true);
	}

	public endsWith(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.EndsWith, value, true);
	}

	public doesNotEndWith(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotEndWith, value, true);
	}

	public contains(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.Contains, value, true);
	}

	public doesNotContain(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotContain, value, true);
	}

	public soundsLike(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.SoundsLike, value, true);
	}

	public doesNotSoundLike(
		property: PropertyInput<T>,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotSoundLike, value, true);
	}

	public has<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.Has, value);
	}

	public doesNotHave<P extends PropertyInput<T>>(
		property: P,
		value: Maybe<ValueFor<T, NoInfer<P>>>,
	): this {
		return this.op(property, QueryOperator.DoesNotHave, value);
	}
}
