import { parse, Token } from '@messageformat/parser';

type Ast = ReturnType<typeof parse>;

export type CompiledPureText = string;
export type CompiledArgList = string[];
export type CompiledPlural = ["plural" | "selectordinal", number, Record<string, Array<number | CompiledAstContents>>];
export type CompiledSelect = ["select", string | number, Record<string, Array<number | CompiledAstContents>>];
export type CompiledAstContents = CompiledPureText | number | CompiledPlural | CompiledSelect;
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
        if (node.type === "content") {
            return node.value;
        }
        if (node.type === "argument") {
            return args.indexOf(node.arg);
        }
        if (node.type === "plural") {
            return [
                "plural",
                args.indexOf(node.arg),
                Object.fromEntries(node.cases.map((selectCase) => {
                    // e.g.: {count, plural, one {# Bild} other {# Bilder} }
                    const key = selectCase.key;
                    const value: any[] = [];
                    selectCase.tokens.forEach((token) => {
                        if (token.type === "octothorpe") {
                            value.push(args.indexOf("#"));
                        } else {
                            value.push(...compileAst([token], args)); 
                        }
                    });
                    return [key, value];
                }))
            ] satisfies CompiledPlural;
        }
        if (node.type === "selectordinal" || node.type === "select") {
            return [
                node.type,
                args.indexOf(node.arg),
                Object.fromEntries(node.cases.map((selectCase) => {
                    // e.g.: {You finished {place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}!}
                    const key = selectCase.key;
                    const value: any[] = [];
                    selectCase.tokens.forEach((token) => {
                        if (token.type === "octothorpe") {
                            value.push(args.indexOf("#"));
                        } else {
                            value.push(...compileAst([token], args)); 
                        }
                    });
                    return [key, value];
                }))
            ]
        }
        throw new Error("Unexpected node type: " + node.type);
    });
}

const getAllArguments = (ast: Ast): string[] => {
    const args = new Set<string>();
    const getArgs = (node: Token) => {
        switch (node.type) {
            case 'content':
                break;
            case 'function':
                node.param?.forEach(getArgs);
                break;
            case 'plural': 
            case 'select':
            case 'selectordinal':
                args.add(node.arg);
                node.cases.forEach((selectCase) => {
                    selectCase.tokens.forEach(getArgs);
                });
                break;
            case 'argument':
                args.add(node.arg);
                break;
            case 'octothorpe':
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

