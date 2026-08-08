# react-querykit-builder

React-friendly bindings for [`querykit-builder`](https://www.npmjs.com/package/querykit-builder). Provides a hook that keeps a `QueryBuilder` in sync with React renders while letting you mutate the builder imperatively.

## Installation

```bash
npm install react-querykit-builder querykit-builder
```

## Which hook do I want?

- **`useFilters`** — you already own the filter values (nuqs, props, context) and
  just need the query string. This is the recommended path for filter UIs.
- **`useSort`** — column sorting, controlled or uncontrolled.
- **`usePagination`** — page state that snaps back to 1 when the filters or sort
  change, without the wasted request an effect-based reset causes.
- **`useQueryBuilder`** — a stateful builder with AST editing (`conditions`,
  `removeCondition`, `replaceCondition`). Useful when the query is assembled
  imperatively or edited in place (filter chips) rather than derived from values.

All hooks accept an optional entity type for compile-checked property paths:
`useFilters<Player>({ search: (qb) => qb.contains('name', q) })`,
`useSort<Player>()`. Omit it and properties are plain strings.

## `useFilters`

Derives the filter string from a keyed set of fragments. Falsy entries are
dropped, so optional filters are just `value && fragment`. The result is a
string, so its identity is stable by value — safe to put straight into a
TanStack Query key.

```tsx
import { useQueryState, parseAsArrayOf, parseAsString } from 'nuqs';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from 'react-querykit-builder';

export function useEventsList() {
	const [search] = useQueryState('q');
	const [status] = useQueryState('status', parseAsArrayOf(parseAsString).withDefault([]));
	const [from] = useQueryState('from');

	const filters = useFilters({
		search: search && ((qb) => qb.containsCaseInsensitive(['Title', 'Author.Name'], search)),
		status: status.length && ((qb) => qb.in('Status', status)),
		from: from && ((qb) => qb.greaterThanOrEqual('StartsAt', from)),
		active: (qb) => qb.isNull('DeletedAt'),
	});

	return useQuery({
		queryKey: ['events', filters],
		queryFn: () => api.events.all({ filters }),
	});
}
```

Entries may also be strings or existing `QueryBuilder` instances, and an array
works when you don't need keys. Options: `join` (`'&&'` default), `encodeUri`,
`addFilterStatement`.

> The hook recomputes every render on purpose — the fragments are closures that
> change identity anyway, and the output is a primitive, so there is no identity
> churn downstream.

## `useSort`

Cycles columns through asc → desc → unsorted and renders QueryKit's sort input.
Uncontrolled by default; pass `value`/`onChange` to let nuqs (or anything else)
own the state.

```tsx
import { useQueryState } from 'nuqs';
import { useSort } from 'react-querykit-builder';

const [sort, setSort] = useQueryState('sort');
const { sortOrder, toggle, direction } = useSort({
	value: sort,
	onChange: (next) => setSort(next || null), // null clears the param
});

<th onClick={() => toggle('CreatedAt')} aria-sort={direction('CreatedAt') ?? 'none'}>
	Created
</th>

// sortOrder: '-CreatedAt' → pass to the API and into the query key
```

`{ multi: true }` keeps existing columns (or pass it per call: `toggle('Title', { multi: true })`).
Also available: `set(property, direction)`, `remove(property)`, `clear()`,
`isSorted(property)`, `tokens`, and `{ style: 'verbose' }` for `Title asc, Age desc`.

Incoming values are normalized, so `?sort=  -CreatedAt ,Title asc ` becomes
`-CreatedAt, Title` — the query key stays stable regardless of how the URL was typed.

### Storing sort as structured state

If you'd rather keep tokens in the URL instead of a string, `sortParser` plugs
into nuqs (this package does not depend on nuqs):

```tsx
import { createParser } from 'nuqs';
import { sortParser } from 'react-querykit-builder';

const parseAsSort = createParser(sortParser).withDefault([]);
const [tokens, setTokens] = useQueryState('sort', parseAsSort);
```

## `useQueryBuilder`

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

Every core builder operation is available inside `update`, including property list
grouping, `prop()` comparisons, `arith()` expressions and null checks:

```tsx
import { arith, prop } from 'querykit-builder';
import { useQueryBuilder } from 'react-querykit-builder';

const { query, update } = useQueryBuilder();

// search box across several fields
update((qb) => qb.containsCaseInsensitive(['FirstName', 'LastName', 'Email'], term));
// (FirstName, LastName, Email) @=* "..."

update((qb) => qb.and().isNull('DeletedAt'));
// ... && DeletedAt == null

update((qb) => qb.and().greaterThan(arith('Price', '*', 'Quantity'), 1000));
// ... && (Price * Quantity) > 1000

update((qb) => qb.and().notEquals('FirstName', prop('LastName')));
// ... && FirstName != LastName
```

### Editing: chips, remove, replace

Appending is not the only direction anymore. The hook parses its own query
(via the core `parseQuery`) and exposes the conditions as a flat list plus
edit operations — which is exactly what a filter-chip UI needs:

```tsx
const { query, conditions, removeCondition, removeWhere, replaceCondition } =
	useQueryBuilder('(Title @=* "king" || Author.Name @=* "king") && Rating > 4');

// chips
{conditions.map((c, i) => (
	<Chip key={i} onDelete={() => removeCondition(i)}>
		{c.lhs.kind === 'property' ? c.lhs.path : '…'} {c.operator}
	</Chip>
))}

// a control whose value changed: replace instead of reset-and-rebuild
removeWhere((c) => c.lhs.kind === 'property' && c.lhs.path === 'Status');
update((qb) => qb.and().equals('Status', nextStatus));
```

Removing a condition collapses the surrounding logical node, so the query
stays valid (`(A || B) && C` minus `A` → `B && C`), and a top-level `||` left
behind by an edit is parenthesized before further chaining. Edits return
`false` and change nothing when the current query contains raw fragments the
parser rejects. `editConditions(fn)` is the general form: return the
condition to keep, a replacement to swap, or `null` to remove.

If your filters are derived from values (URL state, form state), `useFilters`
is still the simpler model — derive, don't edit.

## `usePagination`

The one behavior every list rewrites: change a filter while on page 5 and the
API returns an empty page. `usePagination` owns that rule — pass the values
that invalidate the page as `resetOn`, and the page snaps back to 1 **in the
same render**, so a query keyed on `[filters, page]` never fires with the new
filters and the stale page (the wasted request an effect-based reset causes).

```tsx
const filters = useFilters({ /* … */ });
const { sortOrder } = useSort();
const { page, pageSize, setPage, next, prev, hasNext } = usePagination({
	pageSize: 25,
	resetOn: [filters, sortOrder],
	totalPages: data?.totalPages,
});

useQuery({
	queryKey: ['events', filters, sortOrder, page],
	// map page/pageSize to whatever your API calls them
	queryFn: () => api.events.list({ filters, sortOrder, pageNumber: page, pageSize }),
});
```

Controlled mode works like `useSort`: pass `page`/`onPageChange` (nuqs). A
reset is reflected in the returned `page` immediately and reported through
`onPageChange(1)` after the render so the URL catches up. An external page
change (browser back restoring `?page=3&q=old`) adopts the accompanying
`resetOn` values, so history navigation does not trigger a spurious reset.

QueryKit has no opinion on pagination parameter names, so neither does this
hook — `page`/`pageSize` are generic; map them at the call site.

## API

### `useFilters(entries, options?) => string`

- `entries`: `Record<string, FilterFragment>` or `FilterFragment[]`, where a
  fragment is `(qb: QueryBuilder) => unknown`, a `QueryBuilder`, a string, or any
  falsy value (dropped).
- `options`: `{ join?: '&&' | '||'; encodeUri?: boolean; addFilterStatement?: boolean }`

### `useSort(options?) => UseSortResult`

- `options`: `{ value?: string | null; onChange?: (sortOrder: string) => void; defaultValue?: string; style?: 'sieve' | 'verbose'; multi?: boolean }`
- returns `{ sortOrder, tokens, direction, isSorted, toggle, set, remove, clear }`

### `usePagination(options?) => UsePaginationResult`

- `options`: `{ pageSize?: number (25); resetOn?: readonly unknown[]; page?: number | null; onPageChange?: (page: number) => void; defaultPage?: number; totalPages?: number }`
- returns `{ page, pageSize, offset, setPage, next, prev, reset, hasPrev, hasNext }`
- `resetOn` is a deps-style array compared element-wise with `Object.is` — pass
  the primitives `useFilters`/`useSort` return.

### `useQueryBuilder(initialQuery?: QueryInput, options?: UseQueryBuilderOptions)`

- `initialQuery`: string | `QueryBuilder` | null | undefined | readonly (string | `QueryBuilder` | null | undefined)[]
- `options`
	- `joinOperator`: `'&&' | '||'` (default `'&&'`) — operator used to join array inputs.
	- `encodeUri`: see `querykit-builder` for details.
	- `addFilterStatement`: see `querykit-builder` for details.

Returns `{ query, update, reset, builder, conditions, editConditions, removeCondition, removeWhere, replaceCondition }`:

- `query`: current query string (`builder.build()`).
- `update((builder) => void)`: apply mutations to the builder and sync state.
- `reset()`: rebuilds the builder from the initial inputs and syncs state.
- `builder`: the underlying `QueryBuilder` instance that also syncs on direct mutations.
- `conditions`: `readonly ConditionExpr[]` — parsed conditions in printed order (empty if unparseable).
- `editConditions(fn)` / `removeCondition(i)` / `removeWhere(pred)` / `replaceCondition(i, cond)`: AST edits; return `false` when the query is unparseable.

## Notes

- `react-querykit-builder` wraps the core [`QueryBuilder`](https://www.npmjs.com/package/querykit-builder); use that package for the full operator list and non-React usage examples.
- `useQueryBuilder` memoizes initial inputs by their serialized value so that rerenders with the same filters do not rebuild the query.
- Nothing here depends on nuqs or TanStack Query — the hooks just produce strings, so they compose with whatever owns your state.
- Text search: derive the filter from a debounced/deferred value (`useDeferredValue`, or nuqs' `throttleMs`), otherwise every keystroke produces a new query key and a new request.
