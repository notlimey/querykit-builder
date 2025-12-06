import { act, renderHook } from '@testing-library/react';
import { QueryBuilder } from 'querykit-builder';
import { describe, expect, it } from 'vitest';
import { useQueryBuilder } from '../src/use-query-builder';

describe('useQueryBuilder', () => {
	it('builds from string and builder inputs using the join operator', () => {
		const extra = new QueryBuilder().equals('Priority', 'High');

		const { result } = renderHook(() =>
			useQueryBuilder(['Status == "Open"', extra]),
		);

		expect(result.current.query).toBe(
			'Status == "Open" && Priority == "High"',
		);
	});

	it('keeps user edits when passed a new array instance with the same contents', () => {
		const { result, rerender } = renderHook(
			({ filters }) => useQueryBuilder(filters),
			{
				initialProps: { filters: ['Status == "Open"'] },
			},
		);

		act(() => {
			result.current.update((builder) =>
				builder
					.and()
					.equals('Priority', 'High')
					.and()
					.equals('Team', 'A'),
			);
		});

		expect(result.current.query).toBe(
			'Status == "Open" && Priority == "High" && Team == "A"',
		);

		// Same values, new array identity: should not rebuild/reset
		rerender({ filters: ['Status == "Open"'] });
		expect(result.current.query).toBe(
			'Status == "Open" && Priority == "High" && Team == "A"',
		);
	});

	it('rebuilds when the serialized initial query changes', () => {
		const { result, rerender } = renderHook(
			({ filters }) => useQueryBuilder(filters),
			{
				initialProps: { filters: ['Status == "Open"'] },
			},
		);

		expect(result.current.query).toBe('Status == "Open"');

		rerender({ filters: ['Status == "Closed"'] as const });
		expect(result.current.query).toBe('Status == "Closed"');
	});

	it('syncs when mutating the returned builder directly', () => {
		const { result } = renderHook(() => useQueryBuilder());

		act(() => {
			result.current.builder
				.equals('City', 'NYC')
				.and()
				.startsWith('Name', 'Bo');
		});

		expect(result.current.query).toBe('City == "NYC" && Name _= "Bo"');
	});

	it('builds combined user filters (id equals 5 and name contains "not")', () => {
		const { result } = renderHook(() => useQueryBuilder());

		act(() => {
			result.current.update((builder) =>
				builder.equals('User.Id', 5).and().contains('User.Name', 'not'),
			);
		});

		expect(result.current.query).toBe('User.Id == 5 && User.Name @= "not"');
	});
});
