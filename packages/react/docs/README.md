# React QueryKit Builder Documentation

## `useQueryBuilder` Hook

The `useQueryBuilder` hook provides a reactive way to construct and manage QueryKit queries in React components. It supports initialization from strings, existing `QueryBuilder` instances, or arrays of both, enabling easy composition and chaining of filters.

### Signature

```typescript
function useQueryBuilder(
  initialQuery: string | QueryBuilder | (string | QueryBuilder)[] = '',
  options?: { encodeUri?: boolean; addFilterStatement?: boolean }
): {
  query: string;
  update: (action: (builder: QueryBuilder) => void) => void;
  reset: () => void;
  builder: QueryBuilder;
}
```

### Features

*   **Reactivity**: The builder automatically re-initializes when the `initialQuery` prop changes.
*   **Composition**: Pass an array of queries to chain them together.
*   **Options**: Configure URI encoding and the "Filters=" prefix.

### Examples

#### Basic Usage

```typescript
import { useQueryBuilder } from 'react-querykit-builder';

const MyComponent = () => {
  const { query, update } = useQueryBuilder();

  const addFilter = () => {
    update((builder) => builder.equals('Status', 'Active'));
  };

  return (
    <div>
      <p>Query: {query}</p>
      <button onClick={addFilter}>Add Filter</button>
    </div>
  );
};
```

#### Simple Widget filter

```typescript
const { query } = useQueryBuilder(['User.Id == 5', 'User.Name @= "not"']);
// query => 'User.Id == 5 && User.Name @= "not"'
```

#### Advanced composition with context + props

```typescript
const { query } = useQueryBuilder(
  [
    filters.events, // from context
    new QueryBuilder().equals('Team.Id', teamId ?? ''),
    incomingFilterFromProps,
  ],
  { addFilterStatement: false, encodeUri: false },
);
// Automatically re-composes when any piece changes, while preserving user edits
```

#### Limitations / gotchas

- If you mutate the provided builder outside of the hook return, the hook only stays in sync because it wraps a reactive builder; prefer `update` for clarity.
- Inline array inputs are compared by value; avoid mutating the same `QueryBuilder` instance without changing its identity if you rely on `initialQuery` changes to rebuild.

#### Chaining Hooks (Composition)

You can easily compose queries from multiple sources (e.g., context, props, internal logic) by passing an array to `useQueryBuilder`. This is particularly useful for creating specialized hooks that build upon each other.

**Example: Widget Events Filter**

```typescript
import { QueryBuilder } from 'querykit-builder';
import { useQueryBuilder } from 'react-querykit-builder';

// Base hook for fetching events
export default function useEvents(
  props: BasePaginatedResultDto,
  includeRelatedEvents = false,
) {
  return useAPI<PaginatedResponse<TSEvent>>({
    queryFn: async ({ api }) =>
      api.matches.events.allUnassigned(props, includeRelatedEvents),
    queryKey: ['events', ...Object.values(props)],
  });
}

// Specialized hook combining context filters with an optional passed filter
export const useWidgetMatchEvents = (
  filter?: string | QueryBuilder,
  includeRelatedEvents = false,
) => {
  const { filters } = useWidgetContext();

  // Compose the context filter with the passed filter
  // The hook will automatically handle updates if either changes
  const { query } = useQueryBuilder([filters.events, filter], {
    addFilterStatement: false,
    encodeUri: false,
  });

  return useEvents(
    {
      filters: query,
      pageNumber: 1,
      pageSize: 1000,
    },
    includeRelatedEvents,
  );
};

// Further specialized hook adding a Team ID filter
export function useWidgetMatchTeamEvents(filter?: string | QueryBuilder) {
  const teamId = useWidgetEntityId('teamId');

  // Create the team filter
  // Note: We can pass the builder instance or the built string
  const teamFilter = new QueryBuilder(false, false)
    .equals('Team.Id', teamId ?? '');

  // Chain: Pass the team filter AND the incoming filter to the parent hook
  // We can pass them as an array if the parent hook supports it, 
  // or we can compose them here if we want to pass a single "filter" argument.
  
  // Option A: If useWidgetMatchEvents expects a single filter item:
  // We can use useQueryBuilder here to merge them first, or just pass an array if we update the signature.
  
  // Assuming useWidgetMatchEvents signature is (filter?: string | QueryBuilder | (string|QueryBuilder)[])
  // return useWidgetMatchEvents([teamFilter, filter], true);

  // Option B: Using the hook to merge them before passing (if signature is strict)
  const { builder } = useQueryBuilder([teamFilter, filter], { 
      addFilterStatement: false, 
      encodeUri: false 
  });
  
  return useWidgetMatchEvents(builder, true);
}
```
