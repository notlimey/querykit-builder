import {
	type ArithExpression,
	type Maybe,
	type PropertyInput,
	type PropertyRef,
	QueryOperator,
} from '../types';
import { CaseInsensitiveQueryBuilder } from './operators-case-insensitive';

export class CountQueryBuilder<
	T = unknown,
> extends CaseInsensitiveQueryBuilder<T> {
	public countGreaterThan(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThan, value);
	}

	public countLessThan(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountLessThan, value);
	}

	public countGreaterThanOrEqual(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThanOrEqual, value);
	}

	public countLessThanOrEqual(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountLessThanOrEqual, value);
	}

	public countEquals(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountEquals, value);
	}

	public countNotEquals(
		property: PropertyInput<T>,
		value: Maybe<number | PropertyRef | ArithExpression>,
	): this {
		return this.op(property, QueryOperator.CountNotEquals, value);
	}
}
