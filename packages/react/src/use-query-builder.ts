import {
	type ConditionExpr,
	flattenConditions,
	mapConditions,
	printQuery,
	type QueryBuilder,
	type QueryBuilderOptions,
	type QueryExpr,
	tryParseQuery,
} from 'querykit-builder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	createObservableBuilder,
	type ObservableBuilder,
	SET_ON_CHANGE,
	serializeInput,
} from './reactive-query-builder.js';

type QueryFragment = string | QueryBuilder | null | undefined;
type QueryInput = QueryFragment | readonly QueryFragment[];
type BuilderFn = (builder: QueryBuilder) => QueryBuilder | void;

type UseQueryBuilderOptions = QueryBuilderOptions & {
	joinOperator?: '&&' | '||';
	/** Dependency array for builder functions. When any value changes, the builder is recreated. */
	deps?: unknown[];
};

export function useQueryBuilder(
	initialQuery: QueryInput | BuilderFn = '',
	{
		encodeUri,
		addFilterStatement,
		joinOperator = '&&',
		deps,
	}: UseQueryBuilderOptions = {},
) {
	const isBuilderFn = typeof initialQuery === 'function';

	const builderFnRef = useRef<BuilderFn | null>(
		isBuilderFn ? (initialQuery as BuilderFn) : null,
	);
	if (isBuilderFn) builderFnRef.current = initialQuery as BuilderFn;

	const depsKey = deps ? JSON.stringify(deps) : undefined;

	// biome-ignore lint/correctness/useExhaustiveDependencies: function identity doesn't matter — tracked via builderFnRef; depsKey serializes deps by value
	const inputKey = useMemo(
		() =>
			isBuilderFn
				? (depsKey ?? '__fn__')
				: serializeInput(initialQuery as QueryInput),
		[initialQuery, depsKey],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: keyed on inputKey to avoid rebuilds from new array references with same contents
	const inputFragments = useMemo(() => {
		if (isBuilderFn) return [] as const;
		const q = initialQuery as QueryInput;
		return Array.isArray(q) ? q : [q];
	}, [inputKey]);

	const builderRef = useRef<ObservableBuilder | null>(null);

	const populateBuilder = useCallback(
		(builder: QueryBuilder) => {
			if (builderFnRef.current) {
				builderFnRef.current(builder);
				return;
			}
			for (const fragment of inputFragments) {
				if (fragment) builder.append(fragment, joinOperator);
			}
		},
		[inputFragments, joinOperator],
	);

	const [query, setQuery] = useState(() => {
		const builder = createObservableBuilder(encodeUri, addFilterStatement);
		populateBuilder(builder);
		builderRef.current = builder;
		return builder.build();
	});

	const hasMountedRef = useRef(false);
	// biome-ignore lint/correctness/useExhaustiveDependencies: inputKey and joinOperator drive rebuilds via populateBuilder
	useEffect(() => {
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			builderRef.current?.[SET_ON_CHANGE](() =>
				setQuery(builderRef.current?.build() ?? ''),
			);
			return;
		}
		const builder = createObservableBuilder(encodeUri, addFilterStatement);
		populateBuilder(builder);
		builder[SET_ON_CHANGE](() => setQuery(builder.build()));
		builderRef.current = builder;
		setQuery(builder.build());
	}, [
		inputKey,
		encodeUri,
		addFilterStatement,
		joinOperator,
		populateBuilder,
	]);

	const update = useCallback((action: (builder: QueryBuilder) => void) => {
		if (builderRef.current) {
			action(builderRef.current);
			setQuery(builderRef.current.build());
		}
	}, []);

	const reset = useCallback(() => {
		const builder = createObservableBuilder(encodeUri, addFilterStatement);
		populateBuilder(builder);
		builder[SET_ON_CHANGE](() => setQuery(builder.build()));
		builderRef.current = builder;
		setQuery(builder.build());
	}, [encodeUri, addFilterStatement, populateBuilder]);

	// ---- AST editing (parseQuery-backed) -------------------------------

	const decode = useCallback(
		(value: string) => {
			if (!encodeUri) return value;
			try {
				return decodeURIComponent(value);
			} catch {
				return value;
			}
		},
		[encodeUri],
	);

	/**
	 * Conditions of the current query in printed order — the list a filter-chip
	 * UI renders. Empty when the query has raw fragments the parser rejects.
	 */
	const conditions = useMemo<readonly ConditionExpr[]>(() => {
		const parsed = tryParseQuery(decode(query));
		return parsed.ok ? flattenConditions(parsed.ast) : [];
	}, [query, decode]);

	const setFromAst = useCallback(
		(ast: QueryExpr | null) => {
			const builder = createObservableBuilder(
				encodeUri,
				addFilterStatement,
			);
			if (ast) {
				const printed = printQuery(ast);
				// protect a top-level || from a later chained &&
				builder.append(ast.type === 'or' ? `(${printed})` : printed);
			}
			builder[SET_ON_CHANGE](() => setQuery(builder.build()));
			builderRef.current = builder;
			setQuery(builder.build());
		},
		[encodeUri, addFilterStatement],
	);

	/**
	 * Rewrites every condition: return the condition to keep it, a new one to
	 * replace it, `null` to remove it (indexes match `conditions`). Returns
	 * false — and changes nothing — when the current query is unparseable.
	 */
	const editConditions = useCallback(
		(
			fn: (
				condition: ConditionExpr,
				index: number,
			) => ConditionExpr | null,
		): boolean => {
			const parsed = tryParseQuery(
				decode(builderRef.current?.build() ?? ''),
			);
			if (!parsed.ok) return false;
			setFromAst(mapConditions(parsed.ast, fn));
			return true;
		},
		[decode, setFromAst],
	);

	const removeCondition = useCallback(
		(index: number) =>
			editConditions((condition, i) => (i === index ? null : condition)),
		[editConditions],
	);

	const removeWhere = useCallback(
		(predicate: (condition: ConditionExpr, index: number) => boolean) =>
			editConditions((condition, i) =>
				predicate(condition, i) ? null : condition,
			),
		[editConditions],
	);

	const replaceCondition = useCallback(
		(index: number, next: ConditionExpr) =>
			editConditions((condition, i) => (i === index ? next : condition)),
		[editConditions],
	);

	return {
		query,
		update,
		reset,
		builder: builderRef.current as QueryBuilder,
		conditions,
		editConditions,
		removeCondition,
		removeWhere,
		replaceCondition,
	};
}
