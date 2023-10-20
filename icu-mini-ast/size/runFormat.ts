import { de, en } from "@messageformat/runtime/lib/cardinals";
import { de as deOd, en as enOd } from "make-plural/ordinals";
import type { CompiledAst } from "../src/formatjs/compile";
import { run } from "../src/formatjs/run";

const deDE = [
    "de-DE",
    de,
    deOd
] as const;
const enUS = [
    "en-US",
    en,
    enOd
] as const;

const imgs = [
    ["count"],
    [
        "plural",
        0,
        {
            "one": [-1, " Bild"],
            "other": [-1, " Bilder"]
        }
    ]
] satisfies CompiledAst;
console.log(run(imgs, deDE, { count: 0 }));