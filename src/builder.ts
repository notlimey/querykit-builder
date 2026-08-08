import { BaseQueryBuilder, type QueryBuilderOptions } from './builder/base';
import { CountQueryBuilder } from './builder/operators-count';
import { parseQuery } from './parser/parser';
import { printQuery } from './parser/printer';
import type { Maybe } from './types';

/**
 * QueryBuilder aggregates operator groups via inheritance to keep the implementation modular.
 */
export default class QueryBuilder<T = unknown> extends CountQueryBuilder<T> {
	/**
	 * Creates a builder pre-loaded with an existing filter string (e.g. from a
	 * URL), parsed and re-printed in normalized form so further chaining is
	 * safe. Throws {@link ParseError} on malformed input.
	 *
	 * @example
	 * QueryBuilder.from('Filters= Age > 21 || VIP == true')
	 *   .and().equals('Status', 'Active')
	 *   .build();
	 * // (Age > 21 || VIP == true) && Status == "Active"
	 */
	public static from<T = unknown>(
		input: Maybe<string>,
		options: QueryBuilderOptions = {},
	): QueryBuilder<T> {
		const builder = new QueryBuilder<T>(
			options.encodeUri ?? false,
			options.addFilterStatement ?? false,
		);
		const ast = parseQuery(input);
		if (!ast) return builder;
		// A top-level || must be parenthesized or a chained && would rebind it.
		const printed = printQuery(ast);
		builder.append(ast.type === 'or' ? `(${printed})` : printed);
		return builder;
	}
}

export { type QueryBuilderOptions, BaseQueryBuilder };
