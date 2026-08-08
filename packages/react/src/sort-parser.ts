import { parseSort, SortBuilder, type SortToken } from 'querykit-builder';

/**
 * Parser shape for URL state libraries (nuqs, `useSearchParams` helpers, …).
 * Deliberately structural — this package does not depend on nuqs.
 *
 * @example
 * import { createParser } from 'nuqs';
 * import { sortParser } from 'react-querykit-builder';
 *
 * const parseAsSort = createParser(sortParser).withDefault([]);
 * const [tokens, setTokens] = useQueryState('sort', parseAsSort);
 */
export const sortParser: {
	parse: (value: string) => SortToken[];
	serialize: (tokens: readonly SortToken[]) => string;
	eq: (a: readonly SortToken[], b: readonly SortToken[]) => boolean;
} = {
	parse: (value) => parseSort(value),
	serialize: (tokens) => serializeSort(tokens),
	eq: (a, b) => serializeSort(a) === serializeSort(b),
};

/** Renders sort tokens back into a QueryKit sort string. */
export function serializeSort(
	tokens: readonly SortToken[],
	style: 'sieve' | 'verbose' = 'sieve',
): string {
	const builder = new SortBuilder({ style });
	for (const token of tokens) {
		builder.sortBy(token.property, token.direction);
	}
	return builder.build();
}
