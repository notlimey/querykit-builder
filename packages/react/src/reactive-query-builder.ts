import { QueryBuilder } from 'querykit-builder';

export class ReactiveQueryBuilder extends QueryBuilder {
	private onChange?: () => void;

	constructor(
		encodeUri?: boolean,
		addFilterStatement?: boolean,
		onChange?: () => void,
	) {
		super(encodeUri, addFilterStatement);
		this.onChange = onChange;
	}

	public setOnChange(onChange?: () => void) {
		this.onChange = onChange;
	}

	private notify(): void {
		if (this.onChange) this.onChange();
	}

	public override addCondition(condition: string): this {
		super.addCondition(condition);
		this.notify();
		return this;
	}

	public override append(
		query: string | QueryBuilder,
		operator?: '&&' | '||',
	): this {
		super.append(query, operator);
		this.notify();
		return this;
	}

	public override and(): this {
		super.and();
		this.notify();
		return this;
	}

	public override or(): this {
		super.or();
		this.notify();
		return this;
	}

	public override openParen(): this {
		super.openParen();
		this.notify();
		return this;
	}

	public override closeParen(): this {
		super.closeParen();
		this.notify();
		return this;
	}

	public override concat(other: QueryBuilder, operator?: '&&' | '||'): this {
		super.concat(other, operator);
		this.notify();
		return this;
	}
}

type SerializableInput = string | QueryBuilder | null | undefined;

export const serializeQueryInput = (
	input: SerializableInput | readonly SerializableInput[],
): string => {
	const isArray = (
		value: SerializableInput | readonly SerializableInput[],
	): value is readonly SerializableInput[] => Array.isArray(value);

	const serialize = (item: SerializableInput) => {
		if (!item) return '';
		if (item instanceof QueryBuilder) return `builder:${item.build()}`;
		return `str:${item}`;
	};

	return isArray(input) ? input.map(serialize).join('|') : serialize(input);
};
