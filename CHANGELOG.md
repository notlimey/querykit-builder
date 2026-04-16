# querykit-builder

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
