import type { QueryBuilder, QueryBuilderOptions } from 'querykit-builder';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ReactiveQueryBuilder,
	serializeQueryInput,
} from './reactive-query-builder';

type QueryInput =
	| string
	| QueryBuilder
	| null
	| undefined
	| (string | QueryBuilder | null | undefined)[];

type UseQueryBuilderOptions = QueryBuilderOptions & {
	joinOperator?: '&&' | '||';
};

export function useQueryBuilder(
	initialQuery: QueryInput = '',
	{
		encodeUri,
		addFilterStatement,
		joinOperator = '&&',
	}: UseQueryBuilderOptions = {},
) {
	const builderRef = useRef<ReactiveQueryBuilder | null>(null);

	const serializedInitial = useMemo(
		() => serializeQueryInput(initialQuery),
		[initialQuery],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: we key on serializedInitial so inline array identities don't churn the builder; initialQuery is read inside but only matters when its serialized value changes.
	const normalizedInputs = useMemo(
		() => (Array.isArray(initialQuery) ? initialQuery : [initialQuery]),
		[serializedInitial],
	);

	const makeBuilder = useCallback(
		(onChange?: () => void) => {
			const builder = new ReactiveQueryBuilder(
				encodeUri,
				addFilterStatement,
			);

			for (const input of normalizedInputs) {
				if (input) builder.append(input, joinOperator);
			}

			builder.setOnChange(onChange);
			return builder;
		},
		[normalizedInputs, encodeUri, addFilterStatement, joinOperator],
	);

	const [query, setQuery] = useState(() => {
		const builder = makeBuilder();
		builderRef.current = builder;
		return builder.build();
	});

	const sync = useCallback(() => {
		if (builderRef.current) {
			setQuery(builderRef.current.build());
		}
	}, []);

	useEffect(() => {
		if (builderRef.current) {
			builderRef.current.setOnChange(sync);
		}
	}, [sync]);

	const initializedRef = useRef(false);
	useEffect(() => {
		if (initializedRef.current) {
			builderRef.current = makeBuilder(sync);
			setQuery(builderRef.current.build());
		} else {
			initializedRef.current = true;
		}
	}, [makeBuilder, sync]);

	const update = useCallback(
		(action: (builder: QueryBuilder) => void) => {
			if (builderRef.current) {
				action(builderRef.current);
				sync();
			}
		},
		[sync],
	);

	const reset = useCallback(() => {
		builderRef.current = makeBuilder(sync);
		sync();
	}, [makeBuilder, sync]);

	return {
		query,
		update,
		reset,
		builder: builderRef.current as QueryBuilder,
	};
}
