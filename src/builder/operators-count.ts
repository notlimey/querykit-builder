import { CaseInsensitiveQueryBuilder } from './operators-case-insensitive';
import { type Maybe, QueryOperator } from '../types';

export class CountQueryBuilder extends CaseInsensitiveQueryBuilder {
	public countGreaterThan(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountGreaterThan, value);
	}

	public countLessThan(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThan, value);
	}

	public countGreaterThanOrEqual(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThanOrEqual, value);
	}

	public countLessThanOrEqual(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThanOrEqual, value);
	}

	public equalsCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountEquals, value);
	}

	public notEqualsCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountNotEquals, value);
	}

	public greaterThanCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountGreaterThan, value);
	}

	public lessThanCaseCount(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountLessThan, value);
	}

	public greaterThanOrEqualCaseCount(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountGreaterThanOrEqual, value);
	}

	public lessThanOrEqualCaseCount(
		property: string,
		value: Maybe<number>,
	): this {
		return this.op(property, QueryOperator.CountLessThanOrEqual, value);
	}

	public countEquals(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountEquals, value);
	}

	public countNotEquals(property: string, value: Maybe<number>): this {
		return this.op(property, QueryOperator.CountNotEquals, value);
	}
}
