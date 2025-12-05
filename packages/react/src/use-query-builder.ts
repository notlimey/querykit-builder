import { QueryBuilder } from 'querykit-builder';
import { useCallback, useRef, useState } from 'react';

export function useQueryBuilder(
	initialQuery: string | QueryBuilder = '',
	options?: { encodeUri?: boolean; addFilterStatement?: boolean },
) {
	const builderRef = useRef<QueryBuilder | null>(null);

	if (!builderRef.current) {
		builderRef.current = new QueryBuilder(
			options?.encodeUri,
			options?.addFilterStatement,
		);
		if (initialQuery) {
			builderRef.current.append(initialQuery);
		}
	}

	const [query, setQuery] = useState(() =>
		(builderRef.current as QueryBuilder).build(),
	);

	const sync = useCallback(() => {
		if (builderRef.current) {
			setQuery(builderRef.current.build());
		}
	}, []);

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
		builderRef.current = new QueryBuilder(
			options?.encodeUri,
			options?.addFilterStatement,
		);
		if (initialQuery) {
			builderRef.current.append(initialQuery);
		}
		sync();
	}, [sync, options?.encodeUri, options?.addFilterStatement, initialQuery]);

	return {
		query,
		update,
		reset,
		builder: builderRef.current as QueryBuilder,
	};
}
