import { BaseQueryBuilder } from './base';
import { type Maybe, QueryOperator } from '../types';

export class CoreQueryBuilder extends BaseQueryBuilder {
	public equals(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.Equals, value);
	}

	public notEquals(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.NotEquals, value);
	}

	public greaterThan(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.GreaterThan, value);
	}

	public lessThan(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.LessThan, value);
	}

	public greaterThanOrEqual(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.GreaterThanOrEqual, value);
	}

	public lessThanOrEqual(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.LessThanOrEqual, value);
	}

	public startsWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.StartsWith, value, true);
	}

	public doesNotStartWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotStartWith, value, true);
	}

	public endsWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.EndsWith, value, true);
	}

	public doesNotEndWith(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotEndWith, value, true);
	}

	public contains(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.Contains, value, true);
	}

	public doesNotContain(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotContain, value, true);
	}

	public soundsLike(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.SoundsLike, value, true);
	}

	public doesNotSoundLike(property: string, value: Maybe<string>): this {
		return this.op(property, QueryOperator.DoesNotSoundLike, value, true);
	}

	public has(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.Has, value);
	}

	public doesNotHave(
		property: string,
		value: Maybe<string | number | boolean>,
	): this {
		return this.op(property, QueryOperator.DoesNotHave, value);
	}
}
