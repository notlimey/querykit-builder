import type { ConditionExpr, QueryExpr } from './ast';

/**
 * All conditions of a query tree in left-to-right (printed) order. This is
 * the list a filter-chip UI renders; the index of each condition is the one
 * `mapConditions`/`removeConditions` see.
 */
export function flattenConditions(
	expr: QueryExpr | null | undefined,
): ConditionExpr[] {
	const out: ConditionExpr[] = [];
	const walk = (node: QueryExpr): void => {
		if (node.type === 'condition') {
			out.push(node);
			return;
		}
		walk(node.left);
		walk(node.right);
	};
	if (expr) walk(expr);
	return out;
}

/**
 * Rewrites every condition through `fn` (indexed in printed order). Returning
 * the condition keeps it, a new condition replaces it, and `null` removes it —
 * a logical node losing one side collapses to the other, and losing both
 * disappears, so the tree stays valid. Returns `null` when nothing remains.
 *
 * @example
 * // drop the chip at index 2
 * const next = mapConditions(ast, (cond, i) => (i === 2 ? null : cond));
 */
export function mapConditions(
	expr: QueryExpr | null | undefined,
	fn: (condition: ConditionExpr, index: number) => ConditionExpr | null,
): QueryExpr | null {
	let index = 0;
	const walk = (node: QueryExpr): QueryExpr | null => {
		if (node.type === 'condition') {
			return fn(node, index++);
		}
		const left = walk(node.left);
		const right = walk(node.right);
		if (left && right) {
			return left === node.left && right === node.right
				? node
				: { type: node.type, left, right };
		}
		return left ?? right;
	};
	return expr ? walk(expr) : null;
}

/** Removes every condition the predicate matches (see {@link mapConditions}). */
export function removeConditions(
	expr: QueryExpr | null | undefined,
	predicate: (condition: ConditionExpr, index: number) => boolean,
): QueryExpr | null {
	return mapConditions(expr, (condition, index) =>
		predicate(condition, index) ? null : condition,
	);
}
