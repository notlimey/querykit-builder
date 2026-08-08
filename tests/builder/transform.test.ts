import { describe, expect, test } from 'vitest';
import {
	type ConditionExpr,
	flattenConditions,
	mapConditions,
	parseQuery,
	printQuery,
	removeConditions,
} from '../../src';

const print = (expr: ReturnType<typeof parseQuery>) =>
	expr ? printQuery(expr) : '';

describe('flattenConditions', () => {
	test('lists conditions in printed order', () => {
		const ast = parseQuery('(A == 1 || B == 2) && C == 3');
		expect(
			flattenConditions(ast).map((c) =>
				c.lhs.kind === 'property' ? c.lhs.path : '?',
			),
		).toEqual(['A', 'B', 'C']);
	});

	test('handles null and single conditions', () => {
		expect(flattenConditions(null)).toEqual([]);
		expect(flattenConditions(parseQuery('A == 1'))).toHaveLength(1);
	});
});

describe('removeConditions', () => {
	test('removes from an && chain without disturbing the rest', () => {
		const ast = parseQuery('A == 1 && B == 2 && C == 3');
		expect(print(removeConditions(ast, (_, i) => i === 1))).toBe(
			'A == 1 && C == 3',
		);
	});

	test('collapses a logical node that loses one side', () => {
		const ast = parseQuery('(A == 1 || B == 2) && C == 3');
		expect(print(removeConditions(ast, (_, i) => i === 0))).toBe(
			'B == 2 && C == 3',
		);
		expect(print(removeConditions(ast, (_, i) => i === 2))).toBe(
			'A == 1 || B == 2',
		);
	});

	test('removing everything yields null', () => {
		expect(
			removeConditions(parseQuery('A == 1 && B == 2'), () => true),
		).toBe(null);
	});

	test('matches by content, e.g. all conditions on one property', () => {
		const ast = parseQuery('Status == "x" && Age > 5 && Status != "y"');
		const next = removeConditions(
			ast,
			(c) => c.lhs.kind === 'property' && c.lhs.path === 'Status',
		);
		expect(print(next)).toBe('Age > 5');
	});
});

describe('mapConditions', () => {
	test('replaces a condition in place', () => {
		const ast = parseQuery('Status == "Active" && Age > 5');
		const replacement: ConditionExpr = {
			type: 'condition',
			lhs: { kind: 'property', path: 'Status' },
			operator: '==' as ConditionExpr['operator'],
			rhs: { kind: 'string', value: 'Archived' },
		};
		const next = mapConditions(ast, (c, i) => (i === 0 ? replacement : c));
		expect(print(next)).toBe('Status == "Archived" && Age > 5');
	});

	test('keeps node identity when nothing changes', () => {
		const ast = parseQuery('A == 1 && B == 2');
		expect(mapConditions(ast, (c) => c)).toBe(ast);
	});
});
