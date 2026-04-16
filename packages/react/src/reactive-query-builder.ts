import { QueryBuilder } from 'querykit-builder';

export const SET_ON_CHANGE = Symbol('setOnChange');

export type ObservableBuilder = QueryBuilder & {
	[SET_ON_CHANGE]: (fn?: () => void) => void;
};

/**
 * Wraps a QueryBuilder in a Proxy that fires `onChange` after any fluent
 * (mutating) method call. Fluent methods are detected by checking if the
 * return value is `this` — no manual allowlist needed.
 */
export function createObservableBuilder(
	encodeUri?: boolean,
	addFilterStatement?: boolean,
	onChange?: () => void,
): ObservableBuilder {
	const builder = new QueryBuilder(encodeUri, addFilterStatement);
	let listener = onChange;

	const proxy = new Proxy(builder, {
		get(target, prop, receiver) {
			if (prop === SET_ON_CHANGE) {
				return (fn?: () => void) => {
					listener = fn;
				};
			}

			const original = Reflect.get(target, prop, receiver);
			if (typeof original !== 'function') {
				return original;
			}

			return function (this: unknown, ...args: unknown[]) {
				const result = original.apply(target, args);
				if (result === target) {
					listener?.();
					return proxy;
				}
				return result;
			};
		},
	});

	return proxy as ObservableBuilder;
}

type QueryFragment = string | QueryBuilder | null | undefined;

export function serializeInput(
	input: QueryFragment | readonly QueryFragment[],
): string {
	const serializeOne = (item: QueryFragment) => {
		if (!item) return '';
		if (item instanceof QueryBuilder) return `builder:${item.build()}`;
		return `str:${item}`;
	};

	if (Array.isArray(input)) {
		return input.map(serializeOne).join('|');
	}
	return serializeOne(input as QueryFragment);
}
