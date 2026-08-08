---
'querykit-builder': minor
'react-querykit-builder': minor
---

Typed property paths, a real query parser, and pagination.

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
