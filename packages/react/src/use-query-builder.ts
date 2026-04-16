import type { QueryBuilder, QueryBuilderOptions } from 'querykit-builder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	createObservableBuilder,
	type ObservableBuilder,
	SET_ON_CHANGE,
	serializeInput,
} from './reactive-query-builder';

type QueryFragment = string | QueryBuilder | null | undefined;
type QueryInput = QueryFragment | readonly QueryFragment[];
type BuilderFn = (builder: QueryBuilder) => QueryBuilder | undefined;

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

	return {
		query,
		update,
		reset,
		builder: builderRef.current as QueryBuilder,
	};
}
