import type { PropertyPath } from './paths';
import type { Maybe } from './types';

export type SortDirection = 'asc' | 'desc';

/**
 * `sieve` renders `Title, -Age` (descending prefixed with `-`).
 * `verbose` renders `Title asc, Age desc`.
 */
export type SortStyle = 'sieve' | 'verbose';

export type SortToken = {
	property: string;
	direction: SortDirection;
};

export interface SortBuilderOptions {
	/** Defaults to `sieve`. */
	style?: SortStyle;
	/** Whether to encode the resulting sort string for use in a URI. Defaults to false. */
	encodeUri?: boolean;
}

/**
 * Parses a QueryKit sort input back into tokens, accepting both the sieve
 * (`Title, -Age`) and verbose (`Title asc, Age desc`) forms. Unparseable or
 * empty entries are skipped, so this is safe to point straight at a URL param.
 *
 * When an entry mixes both forms, the sign prefix wins: `-Title asc` parses
 * as descending.
 *
 * @example
 * parseSort('Title, -Age'); // [{ property: 'Title', direction: 'asc' }, { property: 'Age', direction: 'desc' }]
 */
export function parseSort(input: Maybe<string>): SortToken[] {
	if (!input) return [];

	return input
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0)
		.map((entry) => {
			const descendingPrefix = entry.startsWith('-');
			const withoutPrefix = entry.replace(/^[-+]/, '').trim();
			const match = withoutPrefix.match(/^(\S+)(?:\s+(asc|desc))?$/i);
			if (!match) return null;

			const [, property, keyword] = match;
			const direction: SortDirection =
				descendingPrefix || keyword?.toLowerCase() === 'desc'
					? 'desc'
					: 'asc';

			return { property, direction } satisfies SortToken;
		})
		.filter((token): token is SortToken => token !== null);
}

/**
 * Builds the QueryKit `sortOrder` input: a comma delimited list of properties.
 * Null/undefined properties are skipped so optional sorts keep chaining.
 */
export class SortBuilder<T = unknown> {
	private tokens: SortToken[] = [];
	private style: SortStyle;
	private encodeURI: boolean;

	constructor({
		style = 'sieve',
		encodeUri = false,
	}: SortBuilderOptions = {}) {
		this.style = style;
		this.encodeURI = encodeUri;
	}

	/** Creates a builder from an existing sort string (see {@link parseSort}). */
	public static from<T = unknown>(
		input: Maybe<string>,
		options: SortBuilderOptions = {},
	): SortBuilder<T> {
		const builder = new SortBuilder<T>(options);
		for (const { property, direction } of parseSort(input)) {
			builder.tokens.push({ property, direction });
		}
		return builder;
	}

	public asc(property: Maybe<PropertyPath<T>>): this {
		return this.sortBy(property, 'asc');
	}

	public desc(property: Maybe<PropertyPath<T>>): this {
		return this.sortBy(property, 'desc');
	}

	public sortBy(
		property: Maybe<PropertyPath<T>>,
		direction: SortDirection = 'asc',
	): this {
		if (property === null || property === undefined) return this;
		const trimmed = property.trim();
		if (!trimmed) return this;
		this.tokens.push({ property: trimmed, direction });
		return this;
	}

	/** Removes every sort entry for the given property. */
	public remove(property: string): this {
		this.tokens = this.tokens.filter(
			(token) => token.property !== property,
		);
		return this;
	}

	/** Removes an existing entry for the property, then appends the new direction. */
	public replace(
		property: Maybe<PropertyPath<T>>,
		direction: SortDirection = 'asc',
	): this {
		if (property === null || property === undefined) return this;
		return this.remove(property.trim()).sortBy(property, direction);
	}

	public clear(): this {
		this.tokens = [];
		return this;
	}

	public clone(): SortBuilder<T> {
		const cloned = new SortBuilder<T>({
			style: this.style,
			encodeUri: this.encodeURI,
		});
		cloned.tokens = [...this.tokens];
		return cloned;
	}

	public getTokens(): readonly SortToken[] {
		return this.tokens;
	}

	public build(options: { style?: SortStyle } = {}): string {
		const style = options.style ?? this.style;
		const result = this.tokens
			.map(({ property, direction }) => {
				if (style === 'verbose') return `${property} ${direction}`;
				return direction === 'desc' ? `-${property}` : property;
			})
			.join(', ');

		return this.encodeURI ? encodeURIComponent(result) : result;
	}
}

export default SortBuilder;
