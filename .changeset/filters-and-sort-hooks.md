---
'querykit-builder': minor
'react-querykit-builder': minor
---

Declarative filter and sort primitives.

Core:

- `buildFilters(entries, options?)` — joins a keyed set of filter fragments, dropping falsy entries and parenthesizing any fragment with a top-level `&&`/`||`. Fragments can be callbacks, builders or strings.
- `parseSort(input)` and `SortBuilder.from(input)` — read a sort string (sieve or verbose) back into tokens, so a value from the URL round-trips and normalizes.

React:

- `useFilters(entries, options?)` — derives the filter string from values you already own (nuqs, props, context). Returns a string, so it is stable by value for TanStack Query keys.
- `useSort(options?)` — column sorting with an asc → desc → unsorted cycle, single or multi column, uncontrolled or controlled via `value`/`onChange`.
- `sortParser` / `serializeSort` — structural parser for URL-state libraries; no nuqs dependency.
- Fixed ESM output: relative imports were emitted without `.js` specifiers, which is invalid under Node's ESM resolution (bundlers papered over it). Now built with `nodenext` and verified importable from plain Node. Also marked `sideEffects: false`.
- Packaging: `types` now comes first in both packages' `exports` map (it never matched last), and `react-dom` is no longer a peer dependency — the hooks never touch it.
