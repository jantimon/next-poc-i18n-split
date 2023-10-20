import { number, plural, select } from "@messageformat/runtime";
import { type PluralCategory } from "@messageformat/runtime/lib/cardinals";
import type { CompiledAst, CompiledAstContents } from "./compile";

export const evaluateAst = <T, U>(
  packedAst: CompiledAst,
  locale: Locale,
  args: Record<string, T>,
  formatters: Record<string, (...args: any[]) => U>
) => {
  // pure text can be returned as string:
  if (typeof packedAst === "string") {
    return [packedAst];
  }
  // unpack the AST:
  const [argNames, ...ast] = packedAst;
  const result = ast
    .map((contents) =>
      getContentValues(contents, argNames, args, locale, 0, formatters)
    )
    .flat();
  return result;
};

export const run = <T, U>(
  packedAst: CompiledAst,
  locale: Locale,
  args: Record<string, T>,
  formatters: Record<string, (...args: any[]) => U> = {}
) => evaluateAst(packedAst, locale, args, formatters).join("");

type LcFunc = (n: number | string) => PluralCategory;
type ValueOf<T> = T[keyof T];
/** [The current locale, cardinal, ordinal] e.g: `["en-US", require("@messageformat/runtime/lib/cardinals").en, require("make-plural/ordinals").en ]` */
type Locale = readonly [string, LcFunc, LcFunc];

const getContentValues = <T, U>(
  contents: CompiledAstContents,
  keys: { [keyIndex: number]: string },
  values: Record<string, T>,
  locale: Locale,
  ordinalValue: number,
  formatters: Record<string, (...args: any[]) => U>
): Array<T | string> => {
  if (typeof contents === "string") {
    return [contents];
  }
  if (contents === -1) {
    return [number(locale[0], ordinalValue, 0)];
  }

  if (typeof contents === "number") {
    const key = keys[contents];
    return [values[key]];
  }
  const [kind, attr, data] = contents;
  const value = values[keys[attr]];
  ordinalValue = value as number;
  const resolveChildContent = (content: CompiledAstContents[]) => {
    const result = content
    .map((content) =>
      getContentValues(content, keys, values, locale, ordinalValue, formatters)
    )
    .flat();
    return (result.length && !result.some((item) => typeof item !== "string")) ? [result.join("")] : result;
  }

  switch (kind) {
    case "plural": {
      return resolveChildContent(plural(value as number, 0, locale[1], data) as ValueOf<
        typeof data
      >)
    }
    case "selectordinal": {
      return resolveChildContent(plural(
        value as number,
        0,
        locale[2],
        data,
        true
      ) as ValueOf<typeof data>)
    }
    case "select": {
      return resolveChildContent(select(String(value), data) as ValueOf<typeof data>);
    }
    case "fn": {
      const param =
        typeof contents[3] === "string" ? contents[3].trim() : undefined;
      return resolveChildContent([
        formatters[data](value, locale[0], param) as CompiledAstContents,
      ]);
    }
    case "tag": {
      const childTokens = contents.slice(2);
      // attr -> tag 
      const fn = values[keys[attr]] as (...args: any) => any;
      if (process.env.NODE_ENV !== "production") {
        if (typeof fn !== "function") {
          throw new Error(
            `Expected a function for tag "${keys[attr]}", got ${typeof fn}`
          );
        }
      }
      const children = resolveChildContent(childTokens);
      return [fn(...children)];
    }
  }
};
