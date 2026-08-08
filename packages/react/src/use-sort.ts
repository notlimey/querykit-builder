import {
	type PropertyPath,
	parseSort,
	SortBuilder,
	type SortDirection,
	type SortStyle,
	type SortToken,
} from 'querykit-builder';
import { useCallback, useMemo, useRef, useState } from 'react';

export interface UseSortOptions {
	/**
	 * Controlled value, e.g. from nuqs. When provided, the hook never holds its
	 * own state and every change is reported through `onChange`.
	 */
	value?: string | null;
	/** Called with the next sort string whenever it changes. */
	onChange?: (sortOrder: string) => void;
	/** Initial value when uncontrolled. Defaults to `''`. */
	defaultValue?: string;
	/** Output style. Defaults to `sieve` (`Title, -Age`). */
	style?: SortStyle;
	/**
	 * Whether `toggle`/`set` keep existing sort entries. Defaults to false,
	 * i.e. clicking a column replaces the current sort.
	 */
	multi?: boolean;
}

export interface UseSortResult<T = unknown> {
	/** Normalized sort string, ready for the API and for query keys. */
	sortOrder: string;
	tokens: readonly SortToken[];
	/** Direction for a property, or `undefined` when it is not sorted. */
	direction: (property: PropertyPath<T>) => SortDirection | undefined;
	isSorted: (property: PropertyPath<T>) => boolean;
	/** Cycles a property through asc → desc → unsorted. */
	toggle: (property: PropertyPath<T>, options?: { multi?: boolean }) => void;
	set: (
		property: PropertyPath<T>,
		direction: SortDirection,
		options?: { multi?: boolean },
	) => void;
	remove: (property: PropertyPath<T>) => void;
	clear: () => void;
}

function serializeTokens(tokens: readonly SortToken[], style: SortStyle) {
	const builder = new SortBuilder({ style });
	for (const token of tokens) {
		builder.sortBy(token.property, token.direction);
	}
	return builder.build();
}

function applyToTokens(
	current: readonly SortToken[],
	property: string,
	direction: SortDirection | undefined,
	multi: boolean,
): readonly SortToken[] {
	if (!multi) return direction ? [{ property, direction }] : [];

	if (!direction) {
		return current.filter((token) => token.property !== property);
	}

	const exists = current.some((token) => token.property === property);
	return exists
		? current.map((token) =>
				token.property === property ? { property, direction } : token,
			)
		: [...current, { property, direction }];
}

/**
 * Manages QueryKit sort state. Works uncontrolled, or controlled by whatever
 * owns the state already — pass `value`/`onChange` to back it with nuqs:
 *
 * @example
 * const [sort, setSort] = useQueryState('sort');
 * const { sortOrder, toggle, direction } = useSort({
 *   value: sort,
 *   onChange: (next) => setSort(next || null),
 * });
 *
 * <th onClick={() => toggle('CreatedAt')} aria-sort={direction('CreatedAt') ?? 'none'} />
 */
export function useSort<T = unknown>({
	value,
	onChange,
	defaultValue = '',
	style = 'sieve',
	multi = false,
}: UseSortOptions = {}): UseSortResult<T> {
	const isControlled = value !== undefined;
	const [internalValue, setInternalValue] = useState(defaultValue);
	const currentValue = isControlled ? (value ?? '') : internalValue;

	// Mirrors internalValue so consecutive updates inside one event handler
	// build on each other instead of on this render's snapshot. Only commit
	// writes either, so the two never diverge.
	const uncontrolledRef = useRef(internalValue);

	const tokens = useMemo(() => parseSort(currentValue), [currentValue]);

	const sortOrder = useMemo(
		() => serializeTokens(tokens, style),
		[tokens, style],
	);

	const commit = useCallback(
		(update: (current: readonly SortToken[]) => readonly SortToken[]) => {
			// Controlled updates still read the prop: until the owner feeds the
			// change back, the value genuinely hasn't changed.
			const base = isControlled ? (value ?? '') : uncontrolledRef.current;
			const nextValue = serializeTokens(update(parseSort(base)), style);
			if (!isControlled) {
				uncontrolledRef.current = nextValue;
				setInternalValue(nextValue);
			}
			onChange?.(nextValue);
		},
		[isControlled, onChange, style, value],
	);

	const directionOf = useCallback(
		(property: string) =>
			tokens.find((token) => token.property === property)?.direction,
		[tokens],
	);

	const toggle = useCallback(
		(property: string, options?: { multi?: boolean }) =>
			commit((current) => {
				const from = current.find(
					(token) => token.property === property,
				)?.direction;
				const next: SortDirection | undefined =
					from === undefined
						? 'asc'
						: from === 'asc'
							? 'desc'
							: undefined;
				return applyToTokens(
					current,
					property,
					next,
					options?.multi ?? multi,
				);
			}),
		[commit, multi],
	);

	const set = useCallback(
		(
			property: string,
			direction: SortDirection,
			options?: { multi?: boolean },
		) =>
			commit((current) =>
				applyToTokens(
					current,
					property,
					direction,
					options?.multi ?? multi,
				),
			),
		[commit, multi],
	);

	const remove = useCallback(
		(property: string) =>
			commit((current) =>
				applyToTokens(current, property, undefined, true),
			),
		[commit],
	);

	const clear = useCallback(() => commit(() => []), [commit]);

	return {
		sortOrder,
		tokens,
		direction: directionOf,
		isSorted: useCallback(
			(property: string) => directionOf(property) !== undefined,
			[directionOf],
		),
		toggle,
		set,
		remove,
		clear,
	};
}
