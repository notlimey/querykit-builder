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

### Typed property paths

Give the builder your entity type and property names become compile-checked
dot-paths — including nested and collection paths — instead of arbitrary
strings. QueryKit matches property names case-insensitively server-side, so
paths from a camelCased generated API client work as-is against PascalCase C#
properties.

```typescript
import type { Player } from './api-client';

new QueryBuilder<Player>()
	.equals('team.club.id', clubId)   // ✓ autocompleted
	.and()
	.greaterThan('age', 18)
	.build();

new QueryBuilder<Player>().equals('team.club.oops', 1);
// type error: '"team.club.oops"' is not assignable …

new SortBuilder<Player>().desc('createdAt').build();
buildFilters<Player>({ search: (qb) => qb.contains('name', search) });
```

Values are checked against the type at the path, not just the path itself:

```typescript
const qb = new QueryBuilder<Ticket>();
qb.equals('points', 18);              // ✓ number field
qb.equals('points', 'eighteen');      // type error
qb.equals('status', 'Open');          // literal unions survive:
qb.equals('status', 'Archived');      // type error — not 'Open' | 'Closed'
qb.greaterThan('createdAt', '2024-01-01'); // Date fields take ISO strings
qb.has('labels', 'bug');              // collections check their element type
qb.in('status', ['Open', 'Closed']);  // array values too
```

`PathValue<T, P>` is exported if you want the resolution yourself. `prop()`
and `arith()` values stay unrestricted, as do object/`unknown` leaves.

Recursion is depth-capped at 3 segments by default (`team.club.name`) —
entity graphs are cyclic, and the cap is also what keeps huge generated API
clients fast to type-check (a worst-case fully-cyclic 6-entity client checks
in ~0.5s). Use `Path<T, 3>` where you genuinely need deeper, or
`prop('a.b.c.d')` for a one-off. Arrays contribute both themselves (for
has/count operators) and their element paths, and `Date` is a leaf. Typed
builders are strict on purpose: a genuinely dynamic property name goes through
`prop(dynamicName)`, which stays untyped. Omit the type parameter and
everything behaves exactly as before — plain strings.

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

### Parsing a query string

`parseQuery` turns any QueryKit filter string — from a URL, a saved view, a
builder — into a real tree, and `printQuery` renders it back. `&&` binds
tighter than `||` (verified against QueryKit's own parser), and the printer
parenthesizes mixed logical nesting defensively so a round-trip can never
change meaning. `parseQuery(printQuery(ast))` is structurally identical to
`ast`.

```typescript
import { parseQuery, printQuery, tryParseQuery } from 'querykit-builder';

parseQuery('(Title, Author.Name) @=* "king" && Rating > 4');
// { type: 'and',
//   left:  { type: 'condition', lhs: { kind: 'group', paths: ['Title', 'Author.Name'] },
//            operator: '@=*', rhs: { kind: 'string', value: 'king' } },
//   right: { type: 'condition', lhs: { kind: 'property', path: 'Rating' },
//            operator: '>', rhs: { kind: 'number', value: 4 } } }

// Unquoted values classify the way QueryKit does: null, guid, datetime,
// number, then property reference — so `FirstName == LastName` stays a
// property-to-property comparison and `CreatedAt > 2022-07-01` a date.

tryParseQuery('Age == ');       // { ok: false, error: ParseError { position: 7 } }
```

This is what makes an editable filter UI possible: hydrate chips from the URL,
edit the tree, `printQuery` it back. `flattenConditions` gives the chip list,
and `mapConditions`/`removeConditions` rewrite the tree while keeping it valid
(a logical node that loses one side collapses to the other):

```typescript
import { flattenConditions, removeConditions } from 'querykit-builder';

const ast = parseQuery('(A == 1 || B == 2) && C == 3');
flattenConditions(ast).length;                          // 3, in printed order
printQuery(removeConditions(ast, (_, i) => i === 0));  // B == 2 && C == 3
```

`QueryBuilder.from` uses the parser to make a builder chainable on top of an
existing string:

```typescript
QueryBuilder.from('Filters= Age > 21 || VIP == true')
	.and()
	.equals('Status', 'Active')
	.build();
// (Age > 21 || VIP == true) && Status == "Active"   ← top-level || protected
```

One tokenizer rule to know: arithmetic operators are only recognized between
spaces (`Price * Quantity`, which is what `arith()` emits), so `-` stays
usable inside dates and signed numbers.

### Validating a raw query string

`validateQuery` now runs the real parser, so it catches everything the parser
does — unknown operators, missing values, unbalanced parens, unquoted string
values — and reports the character position:

```typescript
import { validateQuery } from 'querykit-builder';

validateQuery('User.Id == 5 && User.Name @= "not"'); // { valid: true }
validateQuery('(Price * Quantity) > 1000'); // { valid: true }
validateQuery('User.Id == 5 User.Name @= "not"');
// { valid: false, errors: ['Unexpected "User.Name" after end of expression — … (at position 13)'] }
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

### Combining optional filters

`buildFilters` joins a keyed set of fragments and drops the falsy ones, which is
usually what a filter UI needs — one entry per control, no manual `and()`
bookkeeping. Fragments containing a top-level `&&`/`||` are parenthesized so the
join operator cannot change their meaning.

```typescript
import { buildFilters } from 'querykit-builder';

const filters = buildFilters({
	search: search && ((qb) => qb.containsCaseInsensitive(['Title', 'Author.Name'], search)),
	status: status.length && ((qb) => qb.in('Status', status)),
	minAge: minAge != null && ((qb) => qb.greaterThanOrEqual('Age', minAge)),
	active: (qb) => qb.isNull('DeletedAt'),
});
// (Title, Author.Name) @=* "..." && Status ^^ [...] && Age >= 18 && DeletedAt == null
// with search = '' and status = []: Age >= 18 && DeletedAt == null
```

Entries can also be strings, existing builders, or a plain array; `{ join: '||' }`,
`encodeUri` and `addFilterStatement` are supported. Everything filtered out
yields `''`.

### Reading a sort string back

```typescript
import { parseSort, SortBuilder } from 'querykit-builder';

parseSort('Title, -Age');
// [{ property: 'Title', direction: 'asc' }, { property: 'Age', direction: 'desc' }]

parseSort('Title asc, Age DESC');     // same result — both syntaxes are accepted
SortBuilder.from('  -CreatedAt ,Title ').build(); // -CreatedAt, Title (normalized)
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
- Typed property paths: `QueryBuilder<Entity>` compile-checks dot-paths, with `prop()` as the dynamic escape hatch
- `parseQuery`/`printQuery`: a real parser producing an AST that round-trips losslessly, plus `QueryBuilder.from()` to chain onto existing strings
- Property list grouping, property-to-property comparisons, arithmetic expressions and explicit null checks
- `SortBuilder` for the sort input, `parseSort`/`SortBuilder.from` to read one back
- Typed tokens via `getTokens()` for inspection/debugging
- `validateQuery` backed by the parser, with character positions in errors
- Logical operators (`&&`, `||`)
- Grouping with parentheses
- URL encoding support (disabled by default)

## Limitations / gotchas

- The builder itself is append-only; use `parseQuery` → edit the AST → `printQuery` (or `QueryBuilder.from`) when you need to modify an existing query.
- Arithmetic needs spaces around its operators (`Price * Quantity`); `Price*Quantity` reads as a single word. `arith()` always emits spaces.
- Untyped builders don't schema-validate field names — use `QueryBuilder<Entity>` to get that at compile time.
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
| Optional filter sets | `buildFilters({ a: x && (qb => …) })` | `…` (falsy entries dropped) |
| Parsing sort input | `parseSort('Title, -Age')` | `SortToken[]` |

## Todos
1. CI/CD to simplify deployment

## License

ISC
