import type { ArithExpr, LhsExpr, QueryExpr, RhsExpr } from './ast';

function quote(value: string): string {
	return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function printArith(expr: ArithExpr): string {
	switch (expr.kind) {
		case 'property':
			return expr.path;
		case 'number':
			return String(expr.value);
		case 'binary':
			return `(${printArith(expr.left)} ${expr.op} ${printArith(expr.right)})`;
	}
}

function printLhs(lhs: LhsExpr): string {
	switch (lhs.kind) {
		case 'property':
			return lhs.path;
		case 'group':
			return `(${lhs.paths.join(', ')})`;
		case 'arith':
			return printArith(lhs.expr);
	}
}

function printRhs(rhs: RhsExpr): string {
	switch (rhs.kind) {
		case 'string':
			return quote(rhs.value);
		case 'number':
		case 'boolean':
			return String(rhs.value);
		case 'null':
			return 'null';
		case 'guid':
		case 'datetime':
			return rhs.raw;
		case 'property':
			return rhs.path;
		case 'arith':
			return printArith(rhs.expr);
		case 'array':
			return `[${rhs.values
				.map((value) =>
					typeof value === 'string' ? quote(value) : String(value),
				)
				.join(',')}]`;
	}
}

/**
 * Renders a {@link QueryExpr} back into a QueryKit filter string. Children of
 * a logical node are parenthesized whenever their operator differs from the
 * parent's — including `&&` under `||`, where precedence alone would suffice —
 * so the printed string's meaning never depends on precedence rules. Same-
 * operator chains stay flat: `A && B && C`.
 *
 * `parseQuery(printQuery(ast))` is structurally identical to `ast`.
 */
export function printQuery(expr: QueryExpr): string {
	if (expr.type === 'condition') {
		return `${printLhs(expr.lhs)} ${expr.operator} ${printRhs(expr.rhs)}`;
	}

	const op = expr.type === 'and' ? '&&' : '||';
	const child = (node: QueryExpr): string =>
		node.type === 'condition' || node.type === expr.type
			? printQuery(node)
			: `(${printQuery(node)})`;

	return `${child(expr.left)} ${op} ${child(expr.right)}`;
}
