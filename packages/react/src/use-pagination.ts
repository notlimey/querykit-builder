import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePaginationOptions {
	/** Items per page. Defaults to 25. */
	pageSize?: number;
	/**
	 * Dependency-style list of values (typically `[filters, sortOrder]`) that
	 * snap the page back to 1 whenever any of them changes. Compared
	 * element-wise with `Object.is`, so pass primitives — which is what
	 * `useFilters`/`useSort` return.
	 */
	resetOn?: readonly unknown[];
	/** Controlled page (1-based), e.g. from nuqs. `null` reads as page 1. */
	page?: number | null;
	/** Called with the next page whenever it changes, including resets. */
	onPageChange?: (page: number) => void;
	/** Initial page when uncontrolled. Defaults to 1. */
	defaultPage?: number;
	/** When known, `setPage`/`next` clamp to it and `hasNext` is derived. */
	totalPages?: number;
}

export interface UsePaginationResult {
	/** Current 1-based page, already reset-aware. */
	page: number;
	pageSize: number;
	/** `(page - 1) * pageSize`, for offset-based APIs. */
	offset: number;
	setPage: (page: number) => void;
	next: () => void;
	prev: () => void;
	/** Back to page 1. */
	reset: () => void;
	hasPrev: boolean;
	/** Only known when `totalPages` is provided. */
	hasNext: boolean | undefined;
}

const keysEqual = (a: readonly unknown[], b: readonly unknown[]) =>
	a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

/**
 * Pagination with the one rule everyone rewrites per list: when the filter or
 * sort changes, the page snaps back to 1 — *in the same render*, so a query
 * keyed on `[filters, page]` never fires the wasted request with the new
 * filters and a stale page that an effect-based reset produces.
 *
 * Works uncontrolled, or controlled via `page`/`onPageChange` (nuqs). In
 * controlled mode a reset is reflected in the returned `page` immediately and
 * reported through `onPageChange(1)` after the render, so the URL catches up
 * without the UI ever showing the stale page. QueryKit has no opinion on
 * pagination parameter names — map `page`/`pageSize` to your API's names
 * (`pageNumber`, …) at the call site.
 *
 * @example
 * const filters = useFilters({ … });
 * const { sortOrder } = useSort();
 * const { page, pageSize, setPage } = usePagination({
 *   pageSize: 25,
 *   resetOn: [filters, sortOrder],
 * });
 * useQuery({
 *   queryKey: ['events', filters, sortOrder, page],
 *   queryFn: () => api.events.list({ filters, sortOrder, pageNumber: page, pageSize }),
 * });
 */
export function usePagination({
	pageSize = 25,
	resetOn = [],
	page: controlledPage,
	onPageChange,
	defaultPage = 1,
	totalPages,
}: UsePaginationOptions = {}): UsePaginationResult {
	const isControlled = controlledPage !== undefined;

	// Latest-value ref: resetOn is usually an inline array literal, so
	// depending on it directly would re-create callbacks every render.
	const resetOnRef = useRef(resetOn);
	resetOnRef.current = resetOn;

	// --- Uncontrolled: page and the reset values it was set under live
	// together, so a mismatch IS the reset signal.
	const [snapshot, setSnapshot] = useState({
		key: resetOn,
		page: defaultPage,
	});
	// Mirrors snapshot.page so consecutive next()/setPage() calls inside one
	// event handler compose (same pattern as useSort).
	const pageRef = useRef(defaultPage);
	let effectiveSnapshot = snapshot;
	if (!isControlled && !keysEqual(snapshot.key, resetOn)) {
		// React's "adjust state during render" pattern: the render restarts
		// with page 1 before anything can fetch new-filters + stale-page.
		// Deriving locally as well keeps even this pass's return value right.
		effectiveSnapshot = { key: resetOn, page: 1 };
		pageRef.current = 1;
		setSnapshot(effectiveSnapshot);
	}

	// --- Controlled: track which reset values the page prop was adopted
	// under. Any external page movement (our own onPageChange round-trip,
	// browser navigation) legitimizes the current values.
	const propPage = controlledPage ?? defaultPage;
	const [adopted, setAdopted] = useState({ key: resetOn, page: propPage });
	let effectiveAdopted = adopted;
	if (isControlled && propPage !== adopted.page) {
		effectiveAdopted = { key: resetOn, page: propPage };
		setAdopted(effectiveAdopted);
	}
	const controlledReset =
		isControlled && !keysEqual(effectiveAdopted.key, resetOn);

	const page = isControlled
		? controlledReset
			? 1
			: propPage
		: effectiveSnapshot.page;

	// The returned page is already 1; this only lets the owner (URL) catch up.
	useEffect(() => {
		if (controlledReset) onPageChange?.(1);
	}, [controlledReset, onPageChange]);

	const clamp = useCallback(
		(target: number) => {
			const upper =
				totalPages !== undefined
					? Math.min(target, Math.max(1, totalPages))
					: target;
			return Math.max(1, Math.floor(upper));
		},
		[totalPages],
	);

	const setPage = useCallback(
		(target: number) => {
			const nextPage = clamp(target);
			if (!isControlled) {
				pageRef.current = nextPage;
				setSnapshot({ key: resetOnRef.current, page: nextPage });
			}
			onPageChange?.(nextPage);
		},
		[clamp, isControlled, onPageChange],
	);

	const next = useCallback(
		() => setPage((isControlled ? page : pageRef.current) + 1),
		[isControlled, page, setPage],
	);
	const prev = useCallback(
		() => setPage((isControlled ? page : pageRef.current) - 1),
		[isControlled, page, setPage],
	);
	const reset = useCallback(() => setPage(1), [setPage]);

	return {
		page,
		pageSize,
		offset: (page - 1) * pageSize,
		setPage,
		next,
		prev,
		reset,
		hasPrev: page > 1,
		hasNext: totalPages !== undefined ? page < totalPages : undefined,
	};
}
