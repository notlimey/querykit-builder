import type { QueryBuilderOptions } from './builder';
import QueryBuilder, { BaseQueryBuilder } from './builder';

/**
 * One entry in a filter set. Falsy entries are dropped, which makes optional
 * filters a plain `condition && fragment` expression.
 */
export type FilterFragment<T = unknown> =
	| ((builder: QueryBuilder<T>) => unknown)
	| BaseQueryBuilder<T>
	| string
	| null
	| undefined
	| false
	| 0
	| '';

export interface BuildFiltersOptions extends QueryBuilderOptions {
	/** Operator used between entries. Defaults to `&&`. */
	join?: '&&' | '||';
}

const isBuilder = (value: unknown): value is BaseQueryBuilder =>
	value instanceof BaseQueryBuilder ||
	(typeof value === 'object' &&
		value !== null &&
		typeof (value as BaseQueryBuilder).build === 'function');

const stripPrefix = (query: string) => query.replace(/^Filters=\s*/, '').trim();

/**
 * True when the query contains a `&&`/`||` outside of parentheses and quotes,
 * meaning it needs wrapping before it can be joined with other fragments.
 */
function hasTopLevelLogical(query: string): boolean {
	let depth = 0;
	let inQuote = false;

	for (let i = 0; i < query.length; i++) {
		const char = query[i];

		if (inQuote) {
			if (char === '\\') i++;
			else if (char === '"') inQuote = false;
			continue;
		}

		if (char === '"') inQuote = true;
		else if (char === '(') depth++;
		else if (char === ')') depth--;
		else if (depth === 0 && (char === '&' || char === '|')) {
			if (query[i + 1] === char) return true;
		}
	}

	return false;
}

function resolveFragment<T>(fragment: FilterFragment<T>): string {
	if (!fragment) return '';

	if (typeof fragment === 'string') return stripPrefix(fragment);

	if (typeof fragment === 'function') {
		const builder = new QueryBuilder<T>();
		const result = fragment(builder);
		if (typeof result === 'string') return stripPrefix(result);
		return stripPrefix(
			isBuilder(result) ? result.build() : builder.build(),
		);
	}

	if (isBuilder(fragment)) return stripPrefix(fragment.build());

	return '';
}

/**
 * Combines a set of filter fragments into a single query, dropping the ones
 * that are falsy or produce nothing. Fragments keep their declaration order,
 * and any fragment containing a top-level `&&`/`||` is parenthesized so the
 * join operator cannot change its meaning.
 *
 * When passing a record, the keys are labels for readability only — they are
 * never inspected, deduplicated or emitted.
 *
 * @example
 * buildFilters({
 *   search: search && ((qb) => qb.containsCaseInsensitive(['Title', 'Author.Name'], search)),
 *   status: status.length && ((qb) => qb.in('Status', status)),
 *   active: (qb) => qb.isNull('DeletedAt'),
 * });
 * // (Title, Author.Name) @=* "..." && Status ^^ [...] && DeletedAt == null
 */
export function buildFilters<T = unknown>(
	entries:
		| Readonly<Record<string, FilterFragment<T>>>
		| readonly FilterFragment<T>[],
	options: BuildFiltersOptions = {},
): string {
	const {
		join = '&&',
		encodeUri = false,
		addFilterStatement = false,
	} = options;

	const list = Array.isArray(entries)
		? (entries as readonly FilterFragment<T>[])
		: Object.values(entries as Record<string, FilterFragment<T>>);

	const fragments = list
		.map(resolveFragment)
		.filter((fragment) => fragment.length > 0);

	if (fragments.length === 0) return '';

	const joined = fragments
		.map((fragment) =>
			fragments.length > 1 && hasTopLevelLogical(fragment)
				? `(${fragment})`
				: fragment,
		)
		.join(` ${join} `);

	const query = addFilterStatement ? `Filters= ${joined}` : joined;
	return encodeUri ? encodeURIComponent(query) : query;
}
