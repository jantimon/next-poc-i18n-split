import { parse, Token } from '@messageformat/parser';

type Ast = ReturnType<typeof parse>;

export type CompiledPureText = string;
export type CompiledArgList = string[];
export type CompiledPlural = ["select" | "plural" | "selectordinal", number, Record<string, Array<number | CompiledAstContents>>];
export type CompiledFn = ["fn", number, string, ...CompiledAstContents[]];
export type CompiledAstContents = CompiledPureText | number | CompiledPlural | CompiledFn;
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
        // https://messageformat.github.io/messageformat/api/parser.select/
        if (node.type ==="plural" || node.type === "selectordinal" || node.type === "select") {
            return [
                node.type,
                args.indexOf(node.arg),
                Object.fromEntries(node.cases.map((selectCase) => {
                    // e.g.: {count, plural, one {# Bild} other {# Bilder} }
                    return [ selectCase.key, compileSubToken(selectCase.tokens, args)];
                }))
            ] satisfies CompiledPlural;
        }
        // https://messageformat.github.io/messageformat/api/parser.functionarg/
        if (node.type === "function") {
            return [
                "fn",
                args.indexOf(node.arg),
                node.key,
                ...(node.param ? compileSubToken(node.param, args) : [])
            ] satisfies CompiledFn;
        }
        assertNever(node.type);
    });
}

const compileSubToken = (tokens: Token[], args: string[]): CompiledAstContents[] => {
    const value: CompiledAstContents[] = [];
    tokens.forEach((token) => {
        if (token.type === "octothorpe") {
            value.push(args.indexOf("#"));
        } else {
            value.push(...compileAst([token], args)); 
        }
    });
    return value;
}

const getAllArguments = (ast: Ast): string[] => {
    const args = new Set<string>();
    const getArgs = (node: Token) => {
        switch (node.type) {
            case 'content':
                break;
            case 'function':
                args.add(node.arg);
                if (node.param) {
                    node.param.forEach(getArgs);
                }
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

