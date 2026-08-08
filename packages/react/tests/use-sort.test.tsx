import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSort } from '../src/use-sort';

describe('useSort', () => {
	it('cycles a column through asc, desc and unsorted', () => {
		const { result } = renderHook(() => useSort());

		expect(result.current.sortOrder).toBe('');

		act(() => result.current.toggle('CreatedAt'));
		expect(result.current.sortOrder).toBe('CreatedAt');
		expect(result.current.direction('CreatedAt')).toBe('asc');
		expect(result.current.isSorted('CreatedAt')).toBe(true);

		act(() => result.current.toggle('CreatedAt'));
		expect(result.current.sortOrder).toBe('-CreatedAt');
		expect(result.current.direction('CreatedAt')).toBe('desc');

		act(() => result.current.toggle('CreatedAt'));
		expect(result.current.sortOrder).toBe('');
		expect(result.current.direction('CreatedAt')).toBeUndefined();
		expect(result.current.isSorted('CreatedAt')).toBe(false);
	});

	it('replaces the sort by default and appends in multi mode', () => {
		const { result } = renderHook(() => useSort());

		act(() => result.current.toggle('Title'));
		act(() => result.current.toggle('CreatedAt'));
		expect(result.current.sortOrder).toBe('CreatedAt');

		act(() => result.current.toggle('Title', { multi: true }));
		expect(result.current.sortOrder).toBe('CreatedAt, Title');

		// toggling in place keeps its position
		act(() => result.current.toggle('CreatedAt', { multi: true }));
		expect(result.current.sortOrder).toBe('-CreatedAt, Title');
	});

	it('respects the multi option as a default', () => {
		const { result } = renderHook(() => useSort({ multi: true }));

		act(() => result.current.toggle('Title'));
		act(() => result.current.toggle('CreatedAt'));
		expect(result.current.sortOrder).toBe('Title, CreatedAt');

		act(() => result.current.toggle('Title', { multi: false }));
		expect(result.current.sortOrder).toBe('-Title');
	});

	it('supports set, remove and clear', () => {
		const { result } = renderHook(() => useSort({ multi: true }));

		act(() => result.current.set('Title', 'desc'));
		act(() => result.current.set('CreatedAt', 'asc'));
		expect(result.current.sortOrder).toBe('-Title, CreatedAt');

		act(() => result.current.remove('Title'));
		expect(result.current.sortOrder).toBe('CreatedAt');

		act(() => result.current.clear());
		expect(result.current.sortOrder).toBe('');
	});

	it('composes consecutive updates inside a single event handler', () => {
		const { result } = renderHook(() => useSort({ multi: true }));

		act(() => {
			result.current.toggle('Title');
			result.current.toggle('CreatedAt');
			result.current.set('Rating', 'desc');
		});
		expect(result.current.sortOrder).toBe('Title, CreatedAt, -Rating');
	});

	it('starts from defaultValue when uncontrolled', () => {
		const { result } = renderHook(() =>
			useSort({ defaultValue: 'Title, -Age' }),
		);

		expect(result.current.sortOrder).toBe('Title, -Age');
		expect(result.current.tokens).toEqual([
			{ property: 'Title', direction: 'asc' },
			{ property: 'Age', direction: 'desc' },
		]);
	});

	it('normalizes a messy incoming value', () => {
		const { result } = renderHook(() =>
			useSort({ value: '  -CreatedAt ,Title asc ' }),
		);

		expect(result.current.sortOrder).toBe('-CreatedAt, Title');
	});

	it('reports changes through onChange when controlled', () => {
		const onChange = vi.fn();
		const { result, rerender } = renderHook(
			({ value }: { value: string }) => useSort({ value, onChange }),
			{ initialProps: { value: '' } },
		);

		act(() => result.current.toggle('CreatedAt'));
		expect(onChange).toHaveBeenCalledWith('CreatedAt');
		// controlled: nothing changes until the owner feeds the value back
		expect(result.current.sortOrder).toBe('');

		rerender({ value: 'CreatedAt' });
		expect(result.current.sortOrder).toBe('CreatedAt');

		act(() => result.current.toggle('CreatedAt'));
		expect(onChange).toHaveBeenLastCalledWith('-CreatedAt');
	});

	it('treats a null controlled value as empty (nuqs clears params with null)', () => {
		const onChange = vi.fn();
		const { result } = renderHook(() => useSort({ value: null, onChange }));

		expect(result.current.sortOrder).toBe('');

		act(() => result.current.toggle('Title'));
		expect(onChange).toHaveBeenCalledWith('Title');
	});

	it('emits verbose syntax when configured', () => {
		const { result } = renderHook(() =>
			useSort({ style: 'verbose', defaultValue: 'Title, -Age' }),
		);

		expect(result.current.sortOrder).toBe('Title asc, Age desc');

		act(() => result.current.toggle('Title', { multi: true }));
		expect(result.current.sortOrder).toBe('Title desc, Age desc');
	});
});
