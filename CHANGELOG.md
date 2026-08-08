# querykit-builder

## 0.1.0

### Minor Changes

- c19d346: Catch up with newer QueryKit syntax:

  - **Property list grouping** — every operator now accepts a string array as the property, rendering `(FirstName, LastName) @=* "paul"`.
  - **Property-to-property comparisons** — `prop('LastName')` on the value side renders unquoted, so literals that happen to match a property name stay quoted.
  - **Arithmetic expressions** — `arith('Price', '*', 'Quantity')` builds `(Price * Quantity)` for use as a property or a value, with nesting for precedence.
  - **Explicit null checks** — `isNull()` / `isNotNull()` render `Prop == null` / `Prop != null`; passing `null` to a normal operator remains a no-op.
  - **`SortBuilder`** — builds the sort input in sieve (`Title, -Age`) or verbose (`Title asc, Age desc`) style.
  - `validateQuery` understands property groups, arithmetic expressions, property comparisons and `null`.
  - New `nullCondition` token, plus an optional `properties` field on condition tokens.
  - Fixed `closeParen()` emitting a stray space before `)`.

## 0.0.17

### Patch Changes

- Remove duplicate count methods, fix missing tokens on case-insensitive in/notIn, fix clone losing addFilterStatement, and make addCondition protected.

## 0.0.16

### Patch Changes

- Updated documentation

## 0.0.10

### Patch Changes

- 1f3b9db: - Default `addFilterStatement` to `false` and `encodeUri` to `false` in `QueryBuilder`.
  - Add `NotIn` and `NotInCaseInsensitive` operators.
  - Update `append` method to handle chaining spacing correctly.
  - Add supported operators table to README.
- Updated defaults and added missing functions
