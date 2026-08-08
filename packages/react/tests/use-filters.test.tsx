import { renderHook } from '@testing-library/react';
import { QueryBuilder } from 'querykit-builder';
import { describe, expect, it } from 'vitest';
import { useFilters } from '../src/use-filters';

describe('useFilters', () => {
	it('derives a filter string from keyed fragments', () => {
		const { result } = renderHook(() =>
			useFilters({
				search: (qb) =>
					qb.containsCaseInsensitive(
						['Title', 'Author.Name'],
						'dune',
					),
				active: (qb) => qb.isNull('DeletedAt'),
			}),
		);

		expect(result.current).toBe(
			'(Title, Author.Name) @=* "dune" && DeletedAt == null',
		);
	});

	it('drops falsy entries as the inputs change', () => {
		const { result, rerender } = renderHook(
			({ search, status }: { search: string; status: string[] }) =>
				useFilters({
					search: search && ((qb) => qb.contains('Title', search)),
					status: status.length && ((qb) => qb.in('Status', status)),
				}),
			{ initialProps: { search: '', status: [] as string[] } },
		);

		expect(result.current).toBe('');

		rerender({ search: 'dune', status: [] });
		expect(result.current).toBe('Title @= "dune"');

		rerender({ search: 'dune', status: ['Active'] });
		expect(result.current).toBe('Title @= "dune" && Status ^^ ["Active"]');

		rerender({ search: '', status: ['Active'] });
		expect(result.current).toBe('Status ^^ ["Active"]');
	});

	it('returns a value-stable string across rerenders with equal inputs', () => {
		const { result, rerender } = renderHook(
			({ search }: { search: string }) =>
				useFilters({ search: (qb) => qb.contains('Title', search) }),
			{ initialProps: { search: 'dune' } },
		);

		const first = result.current;
		rerender({ search: 'dune' });

		// strings compare by value, so this is referentially stable for query keys
		expect(result.current).toBe(first);
	});

	it('accepts builders, strings and arrays', () => {
		const extra = new QueryBuilder().equals('Priority', 'High');

		const { result } = renderHook(() =>
			useFilters(['Status == "Open"', extra]),
		);

		expect(result.current).toBe('Status == "Open" && Priority == "High"');
	});

	it('honours the join operator', () => {
		const { result } = renderHook(() =>
			useFilters(
				{ a: (qb) => qb.equals('A', 1), b: (qb) => qb.equals('B', 2) },
				{ join: '||' },
			),
		);

		expect(result.current).toBe('A == 1 || B == 2');
	});
});
