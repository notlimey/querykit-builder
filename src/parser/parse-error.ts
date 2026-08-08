/** Parse failure with the character offset it occurred at. */
export class ParseError extends Error {
	public readonly position: number;
	public readonly input: string;

	constructor(message: string, position: number, input: string) {
		super(message);
		this.name = 'ParseError';
		this.position = position;
		this.input = input;
	}
}
