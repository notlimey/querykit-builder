import { QueryOperator } from "./types";

export default class QueryBuilder {
    private query: string;
    private encodeURi: boolean;

    constructor(encodeUri: boolean = true, addFilterStatement: boolean = true) {
        this.query = "";
        this.encodeURi = encodeUri;
        if (addFilterStatement) {
            this.query += "Filters= ";
        }
    }

    public addCondition(condition: string): this {
        this.query += condition + " ";
        return this;
    }

    private stringifyValue(value: string | number | boolean): string {
        if (typeof value === "string") {
            return `"${value}"`;
        }
        return value.toString();
    }

    private op(property: string, operator: QueryOperator, value: string | number | boolean, forceQuote: boolean = false): this {
        const valStr = forceQuote ? `"${value}"` : this.stringifyValue(value);
        return this.addCondition(`${property} ${operator} ${valStr}`);
    }

    public equals(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.Equals, value); }
    public notEquals(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.NotEquals, value); }
    public greaterThan(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.GreaterThan, value); }
    public lessThan(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.LessThan, value); }
    public greaterThanOrEqual(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.GreaterThanOrEqual, value); }
    public lessThanOrEqual(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.LessThanOrEqual, value); }

    public startsWith(property: string, value: string): this { return this.op(property, QueryOperator.StartsWith, value, true); }
    public doesNotStartWith(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotStartWith, value, true); }
    public endsWith(property: string, value: string): this { return this.op(property, QueryOperator.EndsWith, value, true); }
    public doesNotEndWith(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotEndWith, value, true); }
    public contains(property: string, value: string): this { return this.op(property, QueryOperator.Contains, value, true); }
    public doesNotContain(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotContain, value, true); }
    public soundsLike(property: string, value: string): this { return this.op(property, QueryOperator.SoundsLike, value, true); }
    public doesNotSoundLike(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotSoundLike, value, true); }

    public has(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.Has, value); }
    public doesNotHave(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.DoesNotHave, value); }
    
    public in(property: string, values: (string | number | boolean)[]): this {
        const valueString = values.map((val) => this.stringifyValue(val)).join(", ");
        return this.addCondition(`${property} ${QueryOperator.In} [${valueString}]`);
    }

    public equalsCaseInsensitive(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.EqualsCaseInsensitive, value); }
    public notEqualsCaseInsensitive(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.NotEqualsCaseInsensitive, value); }
    public startsWithCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.StartsWithCaseInsensitive, value, true); }
    public doesNotStartWithCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotStartWithCaseInsensitive, value, true); }
    public endsWithCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.EndsWithCaseInsensitive, value, true); }
    public doesNotEndWithCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotEndWithCaseInsensitive, value, true); }
    public containsCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.ContainsCaseInsensitive, value, true); }
    public doesNotContainCaseInsensitive(property: string, value: string): this { return this.op(property, QueryOperator.DoesNotContainCaseInsensitive, value, true); }
    public hasCaseInsensitive(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.HasCaseInsensitive, value); }
    public doesNotHaveCaseInsensitive(property: string, value: string | number | boolean): this { return this.op(property, QueryOperator.DoesNotHaveCaseInsensitive, value); }
    
    public inCaseInsensitive(property: string, values: (string | number | boolean)[]): this {
        const valueString = values.map((val) => this.stringifyValue(val)).join(", ");
        return this.addCondition(`${property} ${QueryOperator.InCaseInsensitive} [${valueString}]`);
    }

    public and(): this {
        this.query = this.query.trim() + " && ";
        return this;
    }
    public or(): this {
        this.query = this.query.trim() + " || ";
        return this;
    }
    public openParen(): this {
        this.query += "(";
        return this;
    }
    public closeParen(): this {
        this.query += ")";
        return this;
    }

    public concat(other: QueryBuilder, operator?: '&&' | '||'): this {
        const currentTrimmed = this.query.trim();
        const shouldAddOperator = operator && currentTrimmed !== "" && currentTrimmed !== "Filters=";

        if (shouldAddOperator) {
            this.query = currentTrimmed + ` ${operator} `;
        }

        let otherQuery = other.query.trim();
        
        if (otherQuery.startsWith("Filters=")) {
            otherQuery = otherQuery.replace(/^Filters=\s*/, "");
        }

        // Wrap the concatenated query in parentheses
        this.query += `(${otherQuery}) `;
        return this;
    }

    public clone(): QueryBuilder {
        const cloned = new QueryBuilder(this.encodeURi, false);
        cloned.query = this.query;
        return cloned;
    }

    public countGreaterThan(property: string, value: number): this { return this.op(property, QueryOperator.CountGreaterThan, value); }
    public countLessThan(property: string, value: number): this { return this.op(property, QueryOperator.CountLessThan, value); }
    public countGreaterThanOrEqual(property: string, value: number): this { return this.op(property, QueryOperator.CountGreaterThanOrEqual, value); }
    public countLessThanOrEqual(property: string, value: number): this { return this.op(property, QueryOperator.CountLessThanOrEqual, value); }
    
    public equalsCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountEquals, value); }
    public notEqualsCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountNotEquals, value); }
    public greaterThanCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountGreaterThan, value); }
    public lessThanCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountLessThan, value); }
    public greaterThanOrEqualCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountGreaterThanOrEqual, value); }
    public lessThanOrEqualCaseCount(property: string, value: number): this { return this.op(property, QueryOperator.CountLessThanOrEqual, value); }

    public build(): string {
        this.query = this.query.trim();
        return this.encodeURi ? encodeURIComponent(this.query) : this.query;
    }
}