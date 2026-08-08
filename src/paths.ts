/**
 * Recursive dot-path types for typed builders. Verified against QueryKit
 * itself: property matching is case-insensitive server-side
 * (`BindingFlags.IgnoreCase`), so paths derived from a camelCased generated
 * client match PascalCase C# properties as-is.
 */

/** Leaf types that terminate a path. */
export type PathPrimitive = string | number | boolean | bigint | Date | symbol;

/**
 * Depth decrement table. `Prev[3]` is `2`, `Prev[0]` is `never` — the
 * recursion terminator. Extend this tuple if you raise the depth cap.
 */
type Prev = [never, 0, 1, 2, 3, 4, 5];

type PathStep<K extends string, V, Depth extends number> = V extends
	| PathPrimitive
	| ((...args: never[]) => unknown)
	? K
	: V extends readonly (infer E)[]
		? NonNullable<E> extends PathPrimitive
			? K
			: K | `${K}.${Path<NonNullable<E>, Depth>}`
		: V extends object
			? K | `${K}.${Path<V, Depth>}`
			: K;

/**
 * Every dot-path into `T`, up to `Depth + 1` segments. Entity graphs are
 * cyclic, so recursion must be capped — and the cap is also what keeps large
 * generated API clients fast to type-check, which is why the default is 2
 * (three segments: `team.club.name`). Use `Path<T, 3>` where you really need
 * deeper, or `prop()` for a one-off. Arrays are unwrapped to their element
 * type, so a collection contributes both itself (`tags`, for has/count
 * operators) and element paths (`events.title`).
 */
export type Path<T, Depth extends number = 2> = [Depth] extends [never]
	? never
	: T extends readonly (infer E)[]
		? Path<NonNullable<E>, Depth>
		: {
				[K in keyof T & string]: PathStep<
					K,
					NonNullable<T[K]>,
					Prev[Depth]
				>;
			}[keyof T & string];

/**
 * The property type a builder typed as `T` accepts: plain `string` for the
 * untyped default (`T = unknown`), the path union otherwise. Genuinely dynamic
 * property names on a typed builder go through `prop()`, which is deliberately
 * untyped.
 */
export type PropertyPath<T = unknown> = [unknown] extends [T]
	? string
	: [Path<T>] extends [never]
		? string
		: Path<T>;

/** Strips null/undefined and unwraps arrays to their element type. */
type ResolveStep<V> = NonNullable<V> extends readonly (infer E)[]
	? NonNullable<E>
	: NonNullable<V>;

/**
 * The type living at a dot-path into `T`: `PathValue<Player, 'team.club.name'>`
 * is `string`. Arrays resolve to their element type at every step — including
 * the leaf, so `PathValue<Player, 'tags'>` is `string`, which is the type
 * `has`/`in` compare against. `never` for paths that don't exist.
 */
export type PathValue<
	T,
	P extends string,
> = P extends `${infer Head}.${infer Rest}`
	? Head extends keyof ResolveStep<T>
		? PathValue<ResolveStep<T>[Head], Rest>
		: never
	: P extends keyof ResolveStep<T>
		? ResolveStep<ResolveStep<T>[P]>
		: never;

/**
 * Maps a field type to the *input* type an operator accepts for it. Literal
 * unions survive (`status: 'Active' | 'Archived'` only accepts those two),
 * `Date` fields take ISO strings, and object/unknown leaves fall back to any
 * filter value.
 */
type WidenLeaf<V> = [V] extends [never]
	? FilterValueLike
	: V extends string
		? V
		: V extends number
			? V
			: V extends boolean
				? boolean
				: V extends Date
					? string
					: V extends bigint
						? string | number
						: FilterValueLike;

// structural twin of FilterValue in types.ts (paths.ts stays import-free)
type FilterValueLike = string | number | boolean;

/**
 * The literal value an operator accepts for property input `P` on a builder
 * typed as `T`. Untyped builders (`T = unknown`), `prop()`/`arith()` inputs
 * and property groups over mixed types stay permissive.
 */
export type LiteralValueFor<T, P> = [unknown] extends [T]
	? FilterValueLike
	: [P] extends [readonly string[]]
		? WidenLeaf<PathValue<T, P[number] & string>>
		: [P] extends [string]
			? WidenLeaf<PathValue<T, P & string>>
			: FilterValueLike;
