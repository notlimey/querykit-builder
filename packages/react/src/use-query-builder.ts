import { QueryBuilder } from 'querykit-builder';
import { useCallback, useRef, useState } from 'react';

export function useQueryBuilder(initialQuery: string = '') {
	const builderRef = useRef(new QueryBuilder());

	const [query, setQuery] = useState(initialQuery);

	const sync = () => setQuery(builderRef.current.build());

	// biome-ignore lint/correctness/useExhaustiveDependencies: The dependencies are stable
	const update = useCallback((action: (builder: QueryBuilder) => void) => {
		action(builderRef.current);
		sync();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: The dependencies are stable
	const reset = useCallback(() => {
		builderRef.current = new QueryBuilder();
		sync();
	}, []);

	return {
		query,
		update,
		reset,
		builder: builderRef.current,
	};
}
