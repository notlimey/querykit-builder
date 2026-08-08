import {
	type BuildFiltersOptions,
	buildFilters,
	type FilterFragment,
} from 'querykit-builder';

export type { BuildFiltersOptions, FilterFragment };

/**
 * Derives a QueryKit filter string from a keyed set of fragments. Falsy entries
 * are dropped, so optional filters are expressed as plain `value && fragment`.
 * Record keys are labels for readability only — they are never inspected.
 *
 * The state lives wherever you already keep it (nuqs, props, context) — this
 * only derives. The result is a string, so its identity is stable by value and
 * safe to drop straight into a TanStack Query key.
 *
 * @example
 * const [search] = useQueryState('q');
 * const [status] = useQueryState('status', parseAsArrayOf(parseAsString).withDefault([]));
 *
 * const filters = useFilters({
 *   search: search && ((qb) => qb.containsCaseInsensitive(['Title', 'Author.Name'], search)),
 *   status: status.length && ((qb) => qb.in('Status', status)),
 *   active: (qb) => qb.isNull('DeletedAt'),
 * });
 *
 * useQuery({ queryKey: ['events', filters], queryFn: () => api.events.all({ filters }) });
 */
export function useFilters<T = unknown>(
	entries:
		| Readonly<Record<string, FilterFragment<T>>>
		| readonly FilterFragment<T>[],
	options: BuildFiltersOptions = {},
): string {
	// Deliberately not memoized: the fragments are closures that change identity
	// every render, and the result is a primitive, so recomputing is both
	// cheaper than a dependency check and free of identity churn downstream.
	return buildFilters(entries, options);
}
