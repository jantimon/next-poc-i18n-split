//
// This file is not really relevant - it is just a test for icu-mini-ast
//
import React, { ReactNode } from "react";
import { compileToJson } from "./icu-mini-ast/src/formatjs/compile";
import { evaluateAst } from "./icu-mini-ast/src/formatjs/run";
import { en } from "@messageformat/runtime/lib/cardinals";
import { en as enOd } from "make-plural/ordinals";

export const useTranslations = () => { return (t: string, args?: any) => {
    if (!(t in translations)) {
        return `no text for key ${t}`;
    }
    const json = translations[t as keyof typeof translations];
    const result = evaluateAst(json, ["en-US", en, enOd], args, {
        children: (args: any[], locale) => args.length === 1 ? args : args.map((arg, i) => <React.Fragment key={`locale-${i}`}>{arg}</React.Fragment>)
    }) as ReactNode[] | [string];
    return result.length === 1 ? result[0] : result.map((arg, i) => <React.Fragment key={`locale-${i}`}>{arg}</React.Fragment>);
}}

// Pure Mock - does not actually translate anything
const translations = {

    "Hello": compileToJson("Hello <b>{name}</b>! {count, plural, one {You have <b>1</b> message} other {You have <b>{count}</b> messages}}"),

}
