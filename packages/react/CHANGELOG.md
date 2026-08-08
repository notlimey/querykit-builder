# react-querykit-builder

## 2.0.0

### Minor Changes

- Declarative filter and sort primitives.

  Core:

  - `buildFilters(entries, options?)` — joins a keyed set of filter fragments, dropping falsy entries and parenthesizing any fragment with a top-level `&&`/`||`. Fragments can be callbacks, builders or strings.
  - `parseSort(input)` and `SortBuilder.from(input)` — read a sort string (sieve or verbose) back into tokens, so a value from the URL round-trips and normalizes.

  React:

  - `useFilters(entries, options?)` — derives the filter string from values you already own (nuqs, props, context). Returns a string, so it is stable by value for TanStack Query keys.
  - `useSort(options?)` — column sorting with an asc → desc → unsorted cycle, single or multi column, uncontrolled or controlled via `value`/`onChange`.
  - `sortParser` / `serializeSort` — structural parser for URL-state libraries; no nuqs dependency.
  - Fixed ESM output: relative imports were emitted without `.js` specifiers, which is invalid under Node's ESM resolution (bundlers papered over it). Now built with `nodenext` and verified importable from plain Node. Also marked `sideEffects: false`.
  - Packaging: `types` now comes first in both packages' `exports` map (it never matched last), and `react-dom` is no longer a peer dependency — the hooks never touch it.

- Typed property paths, a real query parser, and pagination.

  Core:

  - **Typed property paths** — `QueryBuilder<Entity>`, `SortBuilder<Entity>` and `buildFilters<Entity>` compile-check property names as recursive dot-paths (capped at 3 segments by default — `Path<T, 3>` opts deeper — arrays unwrap to element paths, `Date` is a leaf). `T = unknown` keeps today's plain-string behavior, and `prop()` remains the untyped escape hatch for dynamic names. QueryKit matches property names case-insensitively (`BindingFlags.IgnoreCase`), so camelCase paths from a generated client work against PascalCase C# properties.
  - **Typed values (`PathValue<T, P>`)** — on a typed builder, comparison/has/in values are checked against the type at the path: `equals('points', 'eighteen')` is a type error, literal unions survive (`status` only accepts its members), `Date` fields take ISO strings, and collections check their element type. `prop()`/`arith()` values and object/`unknown` leaves stay unrestricted; untyped builders are unaffected. Non-distributive guards + `NoInfer` keep type-checking fast even on a worst-case fully-cyclic generated client (~0.5s).
  - **`parseQuery` / `printQuery`** — tokenizer + recursive-descent parser producing a real AST (`&&` binds tighter than `||`, matching QueryKit's parser; longest-match operators; QueryKit's unquoted-value classification: null → guid → datetime → number → property reference; escaped and raw string literals; arrays; nested arithmetic with `* / %` precedence). The printer parenthesizes mixed logical nesting defensively, and `parseQuery(printQuery(ast))` is structurally identical to `ast`. `ParseError` carries the character position; `tryParseQuery` is the non-throwing variant.
  - **`QueryBuilder.from(input)`** — hydrate a builder from an existing filter string and keep chaining; a top-level `||` is parenthesized so a following `&&` cannot rebind it.
  - **`validateQuery`** now runs the real parser: it catches unknown operators, missing values, unbalanced parens and unquoted string values, and reports positions.

  - **AST transforms** — `flattenConditions` (chip list in printed order), `mapConditions` / `removeConditions` (rewrite or drop conditions; a logical node losing a side collapses so the tree stays valid).

  React:

  - **`useQueryBuilder` is no longer append-only** — it now exposes `conditions` plus `editConditions` / `removeCondition` / `removeWhere` / `replaceCondition`, parsing its own query and re-printing after each edit (with a top-level `||` parenthesized before further chaining). Edits return `false` untouched when the query contains unparseable raw fragments.
  - **`usePagination({ resetOn, pageSize, page, onPageChange, totalPages })`** — page state that snaps back to 1 when any `resetOn` value changes, derived during render (not in an effect), so a query keyed on `[filters, page]` never fires the wasted request pairing new filters with a stale page. Controlled mode reports resets through `onPageChange(1)`, and an external page change (browser back) adopts its accompanying `resetOn` values instead of spuriously resetting.
  - `useFilters<T>` / `useSort<T>` accept an entity type for compile-checked property paths.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - querykit-builder@0.2.0

## 1.0.0

### Patch Changes

- Updated dependencies [c19d346]
  - querykit-builder@0.1.0

## 0.0.19

### Patch Changes

- Changed type from undefined -> void function

## 0.0.18

### Patch Changes

- Added dependencies to the react hook

## 0.0.17

### Patch Changes

- Replace manual ReactiveQueryBuilder subclass with a Proxy that auto-detects mutations, and simplify the hook internals.

## 0.0.16

### Patch Changes

- Updated documentation
- Updated dependencies
  - querykit-builder@0.0.16

## 0.0.5

### Patch Changes

- UPdated to use latest version of querykit-builder

## 0.0.4

### Patch Changes

- 1f3b9db: - Default `addFilterStatement` to `false` and `encodeUri` to `false` in `QueryBuilder`.
  - Add `NotIn` and `NotInCaseInsensitive` operators.
  - Update `append` method to handle chaining spacing correctly.
  - Add supported operators table to README.
- Updated dependencies [1f3b9db]
- Updated dependencies
  - querykit-builder@0.0.10
