# react-querykit-builder

React-friendly bindings for [`querykit-builder`](https://www.npmjs.com/package/querykit-builder). Provides a hook that keeps a `QueryBuilder` in sync with React renders while letting you mutate the builder imperatively.

## Installation

```bash
npm install react-querykit-builder querykit-builder
```

## Usage

```tsx
import { useQueryBuilder } from 'react-querykit-builder';

export function TicketsFilters() {
	const { query, update, reset, builder } = useQueryBuilder([
		'Status == "Open"',
	]);

	// Compose edits in a single callback to keep updates batched
	const markHighPriority = () =>
		update((qb) => qb.and().equals('Priority', 'High'));

	// Direct mutations on the returned builder also sync automatically
	const clear = () => {
		reset();
		builder.and().equals('Team', 'A'); // appends to the rebuilt query
	};

	return (
		<div>
			<p>Filter: {query}</p>
			<button onClick={markHighPriority}>Add priority</button>
			<button onClick={clear}>Reset</button>
		</div>
	);
}
```

The hook accepts either a string or an array of strings/`QueryBuilder` instances as the initial filter. When you pass multiple initial filters, they are joined with `&&` by default.

## API

`useQueryBuilder(initialQuery?: QueryInput, options?: UseQueryBuilderOptions)`

- `initialQuery`: string | `QueryBuilder` | null | undefined | readonly (string | `QueryBuilder` | null | undefined)[]
- `options`
	- `joinOperator`: `'&&' | '||'` (default `'&&'`) — operator used to join array inputs.
	- `encodeUri`: see `querykit-builder` for details.
	- `addFilterStatement`: see `querykit-builder` for details.

Returns `{ query, update, reset, builder }`:

- `query`: current query string (`builder.build()`).
- `update((builder) => void)`: apply mutations to the builder and sync state.
- `reset()`: rebuilds the builder from the initial inputs and syncs state.
- `builder`: the underlying `QueryBuilder` instance that also syncs on direct mutations.

## Notes

- `react-querykit-builder` wraps the core [`QueryBuilder`](https://www.npmjs.com/package/querykit-builder); use that package for the full operator list and non-React usage examples.
- The hook memoizes initial inputs by their serialized value so that rerenders with the same filters do not rebuild the query.
