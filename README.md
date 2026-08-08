# querykit-builder

This is a TypeScript query builder designed to work with [pdevito3/QueryKit](https://github.com/pdevito3/QueryKit). It provides a fluent interface for constructing filter and sort strings.

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

Null/undefined values are skipped, so optional filters keep chaining:

```typescript
new QueryBuilder().equals('status', undefined).greaterThan('age', 25).build();
// age > 25
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

Token types: `condition`, `conditionArray`, `nullCondition`, `logical`, `paren`, `raw`.

### Validating a raw query string

`validateQuery` performs basic structure checks (operators, parens, alternation):

```typescript
import { validateQuery } from 'querykit-builder';

validateQuery('User.Id == 5 && User.Name @= "not"'); // { valid: true }
validateQuery('(FirstName, LastName) @=* "paul"'); // { valid: true }
validateQuery('(Price * Quantity) > 1000'); // { valid: true }
validateQuery('User.Id == 5 User.Name @= "not"'); // { valid: false, errors: [...] }
```

## Operations

Every operator method takes `(property, value)`. `property` accepts a string, a
string array (property list grouping), a `prop()` reference, or an `arith()`
expression. `value` accepts a literal, a `prop()` reference, or an `arith()`
expression.

### Comparison operators

```typescript
new QueryBuilder().equals('Title', 'Dune').build();                 // Title == "Dune"
new QueryBuilder().notEquals('Title', 'Dune').build();              // Title != "Dune"
new QueryBuilder().greaterThan('Age', 25).build();                  // Age > 25
new QueryBuilder().lessThan('Age', 25).build();                     // Age < 25
new QueryBuilder().greaterThanOrEqual('Age', 25).build();           // Age >= 25
new QueryBuilder().lessThanOrEqual('Age', 25).build();              // Age <= 25
```

### String operators

```typescript
new QueryBuilder().startsWith('Title', 'Du').build();               // Title _= "Du"
new QueryBuilder().doesNotStartWith('Title', 'Du').build();         // Title !_= "Du"
new QueryBuilder().endsWith('Title', 'ne').build();                 // Title _-= "ne"
new QueryBuilder().doesNotEndWith('Title', 'ne').build();           // Title !_-= "ne"
new QueryBuilder().contains('Title', 'un').build();                 // Title @= "un"
new QueryBuilder().doesNotContain('Title', 'un').build();           // Title !@= "un"
new QueryBuilder().soundsLike('Title', 'doon').build();             // Title ~~ "doon"
new QueryBuilder().doesNotSoundLike('Title', 'doon').build();       // Title !~ "doon"
```

### Collection operators

```typescript
new QueryBuilder().has('Tags', 'sci-fi').build();                   // Tags ^$ "sci-fi"
new QueryBuilder().doesNotHave('Tags', 'sci-fi').build();           // Tags !^$ "sci-fi"
new QueryBuilder().in('Status', ['Active', 'Pending']).build();     // Status ^^ ["Active","Pending"]
new QueryBuilder().notIn('Status', ['Closed']).build();             // Status !^^ ["Closed"]
```

### Case-insensitive operators

```typescript
new QueryBuilder().equalsCaseInsensitive('Title', 'dune').build();          // Title ==* "dune"
new QueryBuilder().notEqualsCaseInsensitive('Title', 'dune').build();       // Title !=* "dune"
new QueryBuilder().startsWithCaseInsensitive('Title', 'du').build();        // Title _=* "du"
new QueryBuilder().doesNotStartWithCaseInsensitive('Title', 'du').build();  // Title !_=* "du"
new QueryBuilder().endsWithCaseInsensitive('Title', 'ne').build();          // Title _-=* "ne"
new QueryBuilder().doesNotEndWithCaseInsensitive('Title', 'ne').build();    // Title !_-=* "ne"
new QueryBuilder().containsCaseInsensitive('Title', 'un').build();          // Title @=* "un"
new QueryBuilder().doesNotContainCaseInsensitive('Title', 'un').build();    // Title !@=* "un"
new QueryBuilder().hasCaseInsensitive('Tags', 'sci-fi').build();            // Tags ^$* "sci-fi"
new QueryBuilder().doesNotHaveCaseInsensitive('Tags', 'sci-fi').build();    // Tags !^$* "sci-fi"
new QueryBuilder().inCaseInsensitive('Status', ['active']).build();         // Status ^^* ["active"]
new QueryBuilder().notInCaseInsensitive('Status', ['closed']).build();      // Status !^^* ["closed"]
```

### Count operators

```typescript
new QueryBuilder().countEquals('Tags', 3).build();                  // Tags #== 3
new QueryBuilder().countNotEquals('Tags', 3).build();               // Tags #!= 3
new QueryBuilder().countGreaterThan('Tags', 3).build();             // Tags #> 3
new QueryBuilder().countLessThan('Tags', 3).build();                // Tags #< 3
new QueryBuilder().countGreaterThanOrEqual('Tags', 3).build();      // Tags #>= 3
new QueryBuilder().countLessThanOrEqual('Tags', 3).build();         // Tags #<= 3
```

### Property list grouping

Pass an array of properties to apply one comparison across all of them. QueryKit
uses **OR** logic for positive operators and **AND** logic for negative ones.

```typescript
new QueryBuilder()
	.containsCaseInsensitive(['FirstName', 'LastName', 'Email'], 'john')
	.build();
// (FirstName, LastName, Email) @=* "john"
// → matches when "john" is in FirstName OR LastName OR Email

new QueryBuilder()
	.doesNotContainCaseInsensitive(['FirstName', 'LastName'], 'test')
	.build();
// (FirstName, LastName) !@=* "test"
// → matches when "test" is in neither field

new QueryBuilder().greaterThanOrEqual(['Age', 'YearsOfExperience'], 5).build();
// (Age, YearsOfExperience) >= 5

new QueryBuilder().in(['Status', 'Type'], ['Active', 'Pending']).build();
// (Status, Type) ^^ ["Active","Pending"]
```

Grouping works with nested properties and combines with everything else:

```typescript
new QueryBuilder()
	.containsCaseInsensitive(['Author.Name', 'Author.Email', 'Title'], search)
	.and()
	.greaterThan('Age', 25)
	.build();
// (Author.Name, Author.Email, Title) @=* "..." && Age > 25
```

### Property-to-property comparisons

Wrap the value in `prop()` to compare against another property instead of a
literal. Without it, a string that happens to match a property name stays quoted.

```typescript
import QueryBuilder, { prop } from 'querykit-builder';

new QueryBuilder().equals('FirstName', prop('LastName')).build();
// FirstName == LastName

new QueryBuilder().equals('FirstName', 'LastName').build();
// FirstName == "LastName"   ← literal, not a property

new QueryBuilder()
	.notEquals('FirstName', prop('LastName'))
	.and()
	.greaterThan('Age', prop('Rating'))
	.build();
// FirstName != LastName && Age > Rating
```

Child properties work on either side:

```typescript
new QueryBuilder()
	.equals('Author.Name', prop('Title'))
	.and()
	.equals('Email.Value', prop('CollectionEmail.Value'))
	.build();
// Author.Name == Title && Email.Value == CollectionEmail.Value
```

### Arithmetic expressions

`arith()` builds a parenthesized expression usable as the property or the value.
Parts alternate between operands and `+ - * / %`; bare strings are property
names, numbers are literals, and nested `arith()` calls keep their parentheses.

```typescript
import QueryBuilder, { arith } from 'querykit-builder';

new QueryBuilder().greaterThan(arith('Age', '+', 'Rating'), 50).build();
// (Age + Rating) > 50

new QueryBuilder().greaterThan(arith('Price', '*', 'Quantity'), 1000).build();
// (Price * Quantity) > 1000

new QueryBuilder().equals(arith('Id', '%', 2), 0).build();
// (Id % 2) == 0

new QueryBuilder().greaterThan(arith('A', '+', 'B', '-', 'C'), 10).build();
// (A + B - C) > 10

new QueryBuilder().lessThan(arith('Total', '/', arith('Count', '+', 1)), 100).build();
// (Total / (Count + 1)) < 100

new QueryBuilder().greaterThan('Total', arith('Price', '*', 'Quantity')).build();
// Total > (Price * Quantity)
```

### Null checks

Passing `null`/`undefined` to a normal operator is a no-op by design. Use the
explicit methods when you mean "is null":

```typescript
new QueryBuilder().isNull('DeletedAt').or().isNotNull('Author.Email').build();
// DeletedAt == null || Author.Email != null

new QueryBuilder().isNull(['DeletedAt', 'ArchivedAt']).build();
// (DeletedAt, ArchivedAt) == null
```

### Logical operators, grouping and raw fragments

```typescript
new QueryBuilder().equals('A', 1).and().equals('B', 2).build();     // A == 1 && B == 2
new QueryBuilder().equals('A', 1).or().equals('B', 2).build();      // A == 1 || B == 2

new QueryBuilder()
	.openParen().equals('A', 1).or().equals('B', 2).closeParen()
	.build();
// (A == 1 || B == 2)

new QueryBuilder().equals('A', 1).append('B == 2', '&&').build();   // A == 1 && B == 2
new QueryBuilder().equals('A', 1).concat(other, '&&').build();      // A == 1 && (...)
new QueryBuilder().equals('A', 1).clone();                          // independent copy
```

### Sorting

`SortBuilder` produces QueryKit's sort input. Sieve syntax (`-Prop` for
descending) is the default; `verbose` renders `Prop asc` / `Prop desc`.

```typescript
import { SortBuilder } from 'querykit-builder';

new SortBuilder().asc('Title').desc('Age').desc('Author.Name').build();
// Title, -Age, -Author.Name

new SortBuilder().asc('Title').desc('Age').build({ style: 'verbose' });
// Title asc, Age desc

new SortBuilder({ style: 'verbose' }).sortBy('Title').build();       // Title asc
new SortBuilder({ encodeUri: true }).asc('Title').desc('Age').build(); // Title%2C%20-Age
```

Null/undefined properties are skipped, and entries can be managed after the fact:

```typescript
const sort = new SortBuilder().asc('Title').desc('Age');

sort.clone().remove('Title').build();          // -Age
sort.clone().replace('Age', 'asc').build();    // Title, Age
sort.clone().clear().build();                  // ''
sort.getTokens();                              // [{ property: 'Title', direction: 'asc' }, ...]
```

### Putting it together

```typescript
import QueryBuilder, { arith, prop, SortBuilder } from 'querykit-builder';

const filters = new QueryBuilder()
	.openParen()
		.containsCaseInsensitive(['Title', 'Author.Name'], search)
	.closeParen()
	.and()
	.isNull('DeletedAt')
	.and()
	.greaterThanOrEqual(arith('Score', '+', 'Bonus'), 50)
	.and()
	.notEquals('FirstName', prop('LastName'))
	.build();
// ((Title, Author.Name) @=* "...") && DeletedAt == null && (Score + Bonus) >= 50 && FirstName != LastName

const sortOrder = new SortBuilder().desc('CreatedAt').asc('Title').build();
// -CreatedAt, Title
```

## Features

- Fluent API for building queries
- Full operator parity with QueryKit (comparison, string, collection, case-insensitive, count)
- Property list grouping, property-to-property comparisons, arithmetic expressions and explicit null checks
- `SortBuilder` for the sort input
- Typed tokens via `getTokens()` for inspection/debugging
- `validateQuery` for basic structural checks on raw strings
- Type-safe methods
- Logical operators (`&&`, `||`)
- Grouping with parentheses
- URL encoding support (disabled by default)

## Limitations / gotchas

- The builder is string-based; it does not parse existing queries into AST form. Use `validateQuery` to catch common shape errors in raw strings, but it is not a full parser.
- Inline arrays/strings are accepted, but field names and values are not schema-validated—ensure you pass valid fields for your API.
- Escaping is limited to quotes/backslashes; other special handling (like Unicode normalization) is caller-owned.
- Property list grouping semantics (OR for positive operators, AND for negative ones) are applied server-side by QueryKit; the builder only renders the syntax.
- Arithmetic and property-to-property comparisons require a QueryKit version that supports them (v1.11+).

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

### Supported Syntax

| Feature | Helper | Output |
| :--- | :--- | :--- |
| Property list grouping | `equals(['A', 'B'], 1)` | `(A, B) == 1` |
| Property-to-property | `equals('A', prop('B'))` | `A == B` |
| Arithmetic | `greaterThan(arith('A', '+', 'B'), 5)` | `(A + B) > 5` |
| Null checks | `isNull('A')` / `isNotNull('A')` | `A == null` / `A != null` |
| Sorting | `new SortBuilder().asc('A').desc('B')` | `A, -B` |

## Todos
1. CI/CD to simplify deployment

## License

ISC
