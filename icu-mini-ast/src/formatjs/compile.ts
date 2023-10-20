import { parse, TYPE } from '@formatjs/icu-messageformat-parser';
import type { MessageFormatElement } from '@formatjs/icu-messageformat-parser';

type Ast = ReturnType<typeof parse>;

export type CompiledPureText = string;
export type CompiledArgList = string[];
export type CompiledPlural = ["select" | "plural" | "selectordinal", number, Record<string, Array<number | CompiledAstContents>>];
export type CompiledFn = ["fn", number, string, ...CompiledAstContents[]];
export type CompiledTag = ["tag", number, ...CompiledAstContents[]];
export type CompiledAstContents = CompiledPureText | number | CompiledPlural | CompiledFn | CompiledTag;
export type CompiledAst = CompiledPureText | [CompiledArgList, ...CompiledAstContents[]];

export const compileToJson = (str: string): CompiledAst => {
    const ast = parse(str);
    const args: CompiledArgList = getAllArguments(ast);
    const result = [args, ...compileAst(ast, args)] satisfies CompiledAst;
    // pure text can be returned as string:
    if (result.length === 2 && typeof result[1] === "string") {
        return result[1];
    }
    return result;
}

const compileAst = (ast: Ast, args: string[]): CompiledAstContents[] => {
    return ast.map((node): CompiledAstContents => {
        switch (node.type) {
            case TYPE.literal:
                return node.value;
            case TYPE.argument:
                return args.indexOf(node.value);
            case TYPE.plural:
            case TYPE.select:
                return [
                    node.type === TYPE.select ? "select" : (
                        node.pluralType === "ordinal" ? "selectordinal" : "plural"
                    ),
                    args.indexOf(node.value),
                    Object.fromEntries(Object.entries(node.options).map(([caseName,pluralCase]) => {
                        return [ caseName, compileAst(pluralCase.value, args)]
                    }))
                ] satisfies CompiledPlural;
            case TYPE.tag:
                return [
                    "tag",
                    args.indexOf(node.value),
                    ...compileAst(node.children, args)
                ] satisfies CompiledTag;
            case TYPE.pound:
                return args.indexOf("#");
            case TYPE.time:
                return [
                    "fn",
                    args.indexOf(node.value),
                    "time"
                ] satisfies CompiledFn;
            case TYPE.date:
                return [
                    "fn",
                    args.indexOf(node.value),
                    "date"
                ] satisfies CompiledFn;
            default:
                console.log(node);
                throw new Error("Not implemented");
            }
       
    });
}

const getAllArguments = (ast: Ast): string[] => {
    const args = new Set<string>();
    const getArgs = (node: MessageFormatElement) => {
        switch (node.type) {
            case TYPE.literal:
            case TYPE.pound:
                break;
            case TYPE.number:
            case TYPE.date:
            case TYPE.time:
                args.add(node.value);
                break;
            case TYPE.tag:
                args.add(node.value);
                node.children.forEach(getArgs);
                break;
            case TYPE.plural:
            case TYPE.select:
                args.add(node.value);
                Object.entries(node.options).forEach(([,pluralCase]) => {
                    pluralCase.value.forEach(getArgs);
                });
                break;
            case TYPE.argument:
                args.add(node.value);
                break;
            default:
                assertNever(node);
        }
    }
    ast.forEach(getArgs);
    return [...args];
}

function assertNever(x: never) {
    throw new Error("Unexpected object: " + x);
}

