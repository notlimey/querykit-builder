import {
	type Maybe,
	type PropertyInput,
	QueryOperator,
	type StringValueInput,
	type ValueInput,
} from '../types';
import { BaseQueryBuilder } from './base';

export class CoreQueryBuilder extends BaseQueryBuilder {
	public equals(property: PropertyInput, value: Maybe<ValueInput>): this {
		return this.op(property, QueryOperator.Equals, value);
	}

	public notEquals(property: PropertyInput, value: Maybe<ValueInput>): this {
		return this.op(property, QueryOperator.NotEquals, value);
	}

	public greaterThan(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.GreaterThan, value);
	}

	public lessThan(property: PropertyInput, value: Maybe<ValueInput>): this {
		return this.op(property, QueryOperator.LessThan, value);
	}

	public greaterThanOrEqual(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.GreaterThanOrEqual, value);
	}

	public lessThanOrEqual(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.LessThanOrEqual, value);
	}

	public startsWith(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.StartsWith, value, true);
	}

	public doesNotStartWith(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotStartWith, value, true);
	}

	public endsWith(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.EndsWith, value, true);
	}

	public doesNotEndWith(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotEndWith, value, true);
	}

	public contains(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.Contains, value, true);
	}

	public doesNotContain(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotContain, value, true);
	}

	public soundsLike(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.SoundsLike, value, true);
	}

	public doesNotSoundLike(
		property: PropertyInput,
		value: Maybe<StringValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotSoundLike, value, true);
	}

	public has(property: PropertyInput, value: Maybe<ValueInput>): this {
		return this.op(property, QueryOperator.Has, value);
	}

	public doesNotHave(
		property: PropertyInput,
		value: Maybe<ValueInput>,
	): this {
		return this.op(property, QueryOperator.DoesNotHave, value);
	}
}
