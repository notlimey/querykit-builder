import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePagination } from '../src/use-pagination';

describe('usePagination', () => {
	it('pages forward and back with clamping and offset', () => {
		const { result } = renderHook(() =>
			usePagination({ pageSize: 10, totalPages: 3 }),
		);

		expect(result.current.page).toBe(1);
		expect(result.current.offset).toBe(0);
		expect(result.current.hasPrev).toBe(false);
		expect(result.current.hasNext).toBe(true);

		act(() => result.current.next());
		expect(result.current.page).toBe(2);
		expect(result.current.offset).toBe(10);

		act(() => result.current.setPage(99));
		expect(result.current.page).toBe(3);
		expect(result.current.hasNext).toBe(false);

		act(() => result.current.prev());
		act(() => result.current.prev());
		act(() => result.current.prev());
		expect(result.current.page).toBe(1);

		act(() => result.current.setPage(2));
		act(() => result.current.reset());
		expect(result.current.page).toBe(1);
	});

	it('hasNext is undefined without totalPages', () => {
		const { result } = renderHook(() => usePagination());
		expect(result.current.hasNext).toBeUndefined();
		expect(result.current.pageSize).toBe(25);
	});

	it('composes consecutive updates inside a single event handler', () => {
		const { result } = renderHook(() => usePagination());
		act(() => {
			result.current.next();
			result.current.next();
			result.current.next();
		});
		expect(result.current.page).toBe(4);
	});

	it('resets to page 1 when a resetOn value changes', () => {
		const { result, rerender } = renderHook(
			({ filters }) => usePagination({ resetOn: [filters] }),
			{ initialProps: { filters: 'a' } },
		);

		act(() => result.current.setPage(5));
		expect(result.current.page).toBe(5);

		// unrelated rerender keeps the page
		rerender({ filters: 'a' });
		expect(result.current.page).toBe(5);

		rerender({ filters: 'b' });
		expect(result.current.page).toBe(1);
	});

	it('never lets any render pair the new filters with the stale page', () => {
		const seen: Array<[string, number]> = [];
		const { result, rerender } = renderHook(
			({ filters }) => {
				const pagination = usePagination({ resetOn: [filters] });
				seen.push([filters, pagination.page]);
				return pagination;
			},
			{ initialProps: { filters: 'a' } },
		);

		act(() => result.current.setPage(5));
		rerender({ filters: 'b' });

		// this is the wasted-fetch combination an effect-based reset produces
		expect(seen).not.toContainEqual(['b', 5]);
		expect(seen.at(-1)).toEqual(['b', 1]);
	});

	it('supports controlled mode with reset reported through onPageChange', () => {
		const onPageChange = vi.fn();
		const { result, rerender } = renderHook(
			({ page, filters }) =>
				usePagination({ page, onPageChange, resetOn: [filters] }),
			{ initialProps: { page: 5, filters: 'a' } },
		);

		expect(result.current.page).toBe(5);

		// filter changes: returned page is 1 in the same render…
		rerender({ page: 5, filters: 'b' });
		expect(result.current.page).toBe(1);
		// …and the owner is told to catch up
		expect(onPageChange).toHaveBeenCalledWith(1);

		// owner feeds it back; page stays 1 with the new filters adopted
		rerender({ page: 1, filters: 'b' });
		expect(result.current.page).toBe(1);

		act(() => result.current.setPage(3));
		expect(onPageChange).toHaveBeenLastCalledWith(3);
		rerender({ page: 3, filters: 'b' });
		expect(result.current.page).toBe(3);
	});

	it('adopts an external page change together with new reset values (browser back)', () => {
		const { result, rerender } = renderHook(
			({ page, filters }) => usePagination({ page, resetOn: [filters] }),
			{ initialProps: { page: 5, filters: 'a' } },
		);

		// URL navigation restores an older page AND its filters at once —
		// that page is legitimate under those filters, so no reset.
		rerender({ page: 2, filters: 'old' });
		expect(result.current.page).toBe(2);
	});

	it('treats null controlled page as page 1 (nuqs clears params with null)', () => {
		const { result } = renderHook(() => usePagination({ page: null }));
		expect(result.current.page).toBe(1);
	});
});
