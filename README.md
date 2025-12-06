# querykit-builder

This is a TypeScript query builder designed to work with [pdevito3/QueryKit](https://github.com/pdevito3/QueryKit). It provides a fluent interface for constructing filter strings.

Looking for the react package? [npmjs.com/../react-querykit-builder](https://www.npmjs.com/package/react-querykit-builder)

## Installation

```bash
npm install querykit-builder
```

## Usage

### Simple example

```typescript
import QueryBuilder from 'querykit-builder';

const query = new QueryBuilder()
	.equals('firstName', 'John')
	.and()
	.greaterThan('age', 25)
	.build();

// firstName == "John" && age > 25
```

### Advanced example (grouping and mix of operators)

```typescript
const query = new QueryBuilder()
	.equals('status', 'active')
	.and()
	.openParen()
		.contains('description', 'urgent')
		.or()
		.greaterThan('priority', 5)
	.closeParen()
	.or()
	.openParen()
		.equals('User.Id', 5)
		.or()
		.equals('User.Id', 6)
	.closeParen()
	.build();

// status == "active" && (description @= "urgent" || priority > 5) || (User.Id == 5 || User.Id == 6)
```

### Composing with other builders

```typescript
const base = new QueryBuilder().equals('department', 'IT');
const extra = new QueryBuilder().greaterThan('salary', 50000);

const finalQuery = base.concat(extra, '&&').build();
// department == "IT" && salary > 50000
```

### Inspecting the current query

You can read a typed token view of the current builder state:

```typescript
const qb = new QueryBuilder().equals('User.Id', 5).and().contains('User.Name', 'not');
qb.getTokens();
// [
//   { type: 'condition', property: 'User.Id', operator: '==', value: 5 },
//   { type: 'logical', operator: '&&' },
//   { type: 'condition', property: 'User.Name', operator: '@=', value: 'not' },
// ]
```

### Validating a raw query string

`validateQuery` performs basic structure checks (operators, parens, alternation):

```typescript
import { validateQuery } from 'querykit-builder';

validateQuery('User.Id == 5 && User.Name @= "not"'); // { valid: true }
validateQuery('User.Id == 5 User.Name @= "not"'); // { valid: false, errors: [...] }
```

## Features

- Fluent API for building queries
- Typed tokens via `getTokens()` for inspection/debugging
- `validateQuery` for basic structural checks on raw strings
- Type-safe methods
- Support for standard comparison operators (`==`, `!=`, `>`, `<`, etc.)
- Case-insensitive string operations
- Logical operators (`&&`, `||`)
- Grouping with parentheses
- URL encoding support (disabled by default)

## Limitations / gotchas

- The builder is string-based; it does not parse existing queries into AST form. Use `validateQuery` to catch common shape errors in raw strings, but it is not a full parser.
- Inline arrays/strings are accepted, but field names and values are not schema-validated—ensure you pass valid fields for your API.
- Escaping is limited to quotes/backslashes; other special handling (like Unicode normalization) is caller-owned.

### Supported Operators

| Name | Operator | Case Insensitive Operator | Count Operator |
| :--- | :--- | :--- | :--- |
| Equals | == | ==* | #== |
| Not Equals | != | !=* | #!= |
| Greater Than | > | N/A | #> |
| Less Than | < | N/A | #< |
| Greater Than Or Equal | >= | N/A | #>= |
| Less Than Or Equal | <= | N/A | #<= |
| Starts With | _= | _=* | N/A |
| Does Not Start With | !_= | !_=* | N/A |
| Ends With | _-= | _-=* | N/A |
| Does Not End With | !_-= | !_-=* | N/A |
| Contains | @= | @=* | N/A |
| Does Not Contain | !@= | !@=* | N/A |
| Sounds Like | ~~ | N/A | N/A |
| Does Not Sound Like | !~ | N/A | N/A |
| Has | ^$ | ^$* | N/A |
| Does Not Have | !^$ | !^$* | N/A |
| In | ^^ | ^^* | N/A |
| Not In | !^^ | !^^* | N/A |

## Todos
1. Adding a testing framework
2. CI/CD to simplify deployment

## License

ISC
