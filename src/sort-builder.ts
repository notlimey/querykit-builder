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
 * Builds the QueryKit `sortOrder` input: a comma delimited list of properties.
 * Null/undefined properties are skipped so optional sorts keep chaining.
 */
export class SortBuilder {
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

	public asc(property: Maybe<string>): this {
		return this.sortBy(property, 'asc');
	}

	public desc(property: Maybe<string>): this {
		return this.sortBy(property, 'desc');
	}

	public sortBy(
		property: Maybe<string>,
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
		property: Maybe<string>,
		direction: SortDirection = 'asc',
	): this {
		if (property === null || property === undefined) return this;
		return this.remove(property.trim()).sortBy(property, direction);
	}

	public clear(): this {
		this.tokens = [];
		return this;
	}

	public clone(): SortBuilder {
		const cloned = new SortBuilder({
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
