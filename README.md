# querykit-builder

This is a TypeScript query builder designed to work with [pdevito3/QueryKit](https://github.com/pdevito3/QueryKit). It provides a fluent interface for constructing filter strings.

## Installation

```bash
npm install querykit-builder
```

## Usage

```typescript
import QueryBuilder from 'querykit-builder';

const query = new QueryBuilder()
    .equals("firstName", "John")
    .and()
    .greaterThan("age", 25)
    .build();

console.log(query); 
// Output: Filters= firstName == "John" && age > 25
```

### Complex Queries

You can chain multiple conditions and use parentheses for grouping:

```typescript
const query = new QueryBuilder()
    .equals("status", "active")
    .and()
    .openParen()
        .contains("description", "urgent")
        .or()
        .greaterThan("priority", 5)
    .closeParen()
    .build();
```

### Concatenating Queries

You can combine multiple `QueryBuilder` instances:

```typescript
const baseQuery = new QueryBuilder().equals("department", "IT");
const subQuery = new QueryBuilder().greaterThan("salary", 50000);

const finalQuery = baseQuery.concat(subQuery, "&&").build();
```

## Features

- Fluent API for building queries
- Type-safe methods
- Support for standard comparison operators (`==`, `!=`, `>`, `<`, etc.)
- Case-insensitive string operations
- Logical operators (`&&`, `||`)
- Grouping with parentheses
- URL encoding support (enabled by default)

## License

ISC
