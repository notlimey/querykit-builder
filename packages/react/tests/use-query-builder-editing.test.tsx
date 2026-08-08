import { act, renderHook } from '@testing-library/react';
import type { ConditionExpr } from 'querykit-builder';
import { describe, expect, it } from 'vitest';
import { useQueryBuilder } from '../src/use-query-builder';

describe('useQueryBuilder AST editing', () => {
	it('exposes the conditions of the current query in printed order', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('(A == 1 || B == 2) && C == 3'),
		);

		expect(
			result.current.conditions.map((c) =>
				c.lhs.kind === 'property' ? c.lhs.path : '?',
			),
		).toEqual(['A', 'B', 'C']);
	});

	it('removes a condition by index, collapsing the tree', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('(A == 1 || B == 2) && C == 3'),
		);

		act(() => {
			result.current.removeCondition(0);
		});
		expect(result.current.query).toBe('B == 2 && C == 3');
		expect(result.current.conditions).toHaveLength(2);
	});

	it('removes by predicate — the "clear this filter control" case', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('Status == "x" && Age > 5 && Status != "y"'),
		);

		act(() => {
			result.current.removeWhere(
				(c) => c.lhs.kind === 'property' && c.lhs.path === 'Status',
			);
		});
		expect(result.current.query).toBe('Age > 5');
	});

	it('replaces a condition in place', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('Status == "Active" && Age > 5'),
		);

		const next: ConditionExpr = {
			type: 'condition',
			lhs: { kind: 'property', path: 'Status' },
			operator: '==' as ConditionExpr['operator'],
			rhs: { kind: 'string', value: 'Archived' },
		};
		act(() => {
			result.current.replaceCondition(0, next);
		});
		expect(result.current.query).toBe('Status == "Archived" && Age > 5');
	});

	it('stays chainable after an edit', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('A == 1 && B == 2'),
		);

		act(() => {
			result.current.removeCondition(1);
		});
		act(() => {
			result.current.update((qb) => qb.and().contains('Name', 'x'));
		});
		expect(result.current.query).toBe('A == 1 && Name @= "x"');
	});

	it('protects a top-level || left behind by an edit', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('(A == 1 || B == 2) && C == 3'),
		);

		act(() => {
			result.current.removeCondition(2); // leaves A == 1 || B == 2
		});
		act(() => {
			result.current.update((qb) => qb.and().equals('D', 4));
		});
		expect(result.current.query).toBe('(A == 1 || B == 2) && D == 4');
	});

	it('removing every condition empties the query', () => {
		const { result } = renderHook(() => useQueryBuilder('A == 1'));

		act(() => {
			result.current.removeCondition(0);
		});
		expect(result.current.query).toBe('');
	});

	it('refuses to edit an unparseable query and reports it', () => {
		const { result } = renderHook(() => useQueryBuilder('###not-a-query'));

		expect(result.current.conditions).toEqual([]);
		let outcome = true;
		act(() => {
			outcome = result.current.removeCondition(0);
		});
		expect(outcome).toBe(false);
		expect(result.current.query).toBe('###not-a-query');
	});

	it('reset still restores the initial inputs after edits', () => {
		const { result } = renderHook(() =>
			useQueryBuilder('A == 1 && B == 2'),
		);

		act(() => {
			result.current.removeCondition(0);
		});
		expect(result.current.query).toBe('B == 2');

		act(() => {
			result.current.reset();
		});
		expect(result.current.query).toBe('A == 1 && B == 2');
	});
});
