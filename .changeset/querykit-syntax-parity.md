---
'querykit-builder': minor
---

Catch up with newer QueryKit syntax:

- **Property list grouping** — every operator now accepts a string array as the property, rendering `(FirstName, LastName) @=* "paul"`.
- **Property-to-property comparisons** — `prop('LastName')` on the value side renders unquoted, so literals that happen to match a property name stay quoted.
- **Arithmetic expressions** — `arith('Price', '*', 'Quantity')` builds `(Price * Quantity)` for use as a property or a value, with nesting for precedence.
- **Explicit null checks** — `isNull()` / `isNotNull()` render `Prop == null` / `Prop != null`; passing `null` to a normal operator remains a no-op.
- **`SortBuilder`** — builds the sort input in sieve (`Title, -Age`) or verbose (`Title asc, Age desc`) style.
- `validateQuery` understands property groups, arithmetic expressions, property comparisons and `null`.
- New `nullCondition` token, plus an optional `properties` field on condition tokens.
- Fixed `closeParen()` emitting a stray space before `)`.
