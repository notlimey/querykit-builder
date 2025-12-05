import type { QueryBuilderOptions } from 'querykit-builder';
import { QueryBuilder } from 'querykit-builder';
import { useCallback, useEffect, useRef, useState } from 'react';

type QueryInput =
	| string
	| QueryBuilder
	| null
	| undefined
	| (string | QueryBuilder | null | undefined)[];

export function useQueryBuilder(
	initialQuery: QueryInput = '',
	{ encodeUri, addFilterStatement }: QueryBuilderOptions = {},
) {
	const builderRef = useRef<QueryBuilder | null>(null);

	const createBuilder = useCallback(() => {
		const builder = new QueryBuilder(encodeUri, addFilterStatement);
		const inputs = Array.isArray(initialQuery)
			? initialQuery
			: [initialQuery];

		for (const input of inputs) {
			if (input) builder.append(input);
		}
		return builder;
	}, [initialQuery, encodeUri, addFilterStatement]);

	if (!builderRef.current) {
		builderRef.current = createBuilder();
	}

	const [query, setQuery] = useState(() => builderRef.current!.build());

	const sync = useCallback(() => {
		if (builderRef.current) {
			setQuery(builderRef.current.build());
		}
	}, []);

	useEffect(() => {
		builderRef.current = createBuilder();
		sync();
	}, [createBuilder, sync]);

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
		builderRef.current = createBuilder();
		sync();
	}, [createBuilder, sync]);

	return {
		query,
		update,
		reset,
		builder: builderRef.current as QueryBuilder,
	};
}
