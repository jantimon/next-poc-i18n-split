import { number, plural, select } from "@messageformat/runtime";
import { type PluralCategory } from "@messageformat/runtime/lib/cardinals";
import type { CompiledAst, CompiledAstContents } from "./compile";

export const evaluateAst = <T, U>(
  packedAst: CompiledAst,
  locale: Locale,
  args: Record<string, T>,
  formatters: Record<string, (...args: any[]) => U> = {}
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
  let resolvedContents: CompiledAstContents[];
  ordinalValue = value as number;
  switch (kind) {
    case "plural": {
      resolvedContents = plural(value as number, 0, locale[1], data) as ValueOf<
        typeof data
      >;
      break;
    }
    case "selectordinal": {
      resolvedContents = plural(
        value as number,
        0,
        locale[2],
        data,
        true
      ) as ValueOf<typeof data>;
      break;
    }
    case "select": {
      resolvedContents = select(String(value), data) as ValueOf<typeof data>;
      break;
    }
    case "fn": {
      const param =
        typeof contents[3] === "string" ? contents[3].trim() : undefined;
      resolvedContents = [
        formatters[data](value, locale[0], param) as CompiledAstContents,
      ];
      break;
    }
  }
  return resolvedContents
    .map((content) =>
      getContentValues(content, keys, values, locale, ordinalValue, formatters)
    )
    .flat();
};
