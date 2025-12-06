import { BaseQueryBuilder, type QueryBuilderOptions } from './builder/base';
import { CountQueryBuilder } from './builder/operators-count';

/**
 * QueryBuilder aggregates operator groups via inheritance to keep the implementation modular.
 */
export default class QueryBuilder extends CountQueryBuilder {}

export { QueryBuilderOptions, BaseQueryBuilder };
