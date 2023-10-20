import { de, en } from "@messageformat/runtime/lib/cardinals";
import { de as deOd, en as enOd } from "make-plural/ordinals";
import type { CompiledAst } from "../src/compile";
import { run } from "../src/run";
import * as formatters from "@messageformat/runtime/lib/formatters";

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

const place = [
    ["place"],
    "You finished ",
    [
        "selectordinal",
        0,
        {
            "one": [-1, "st"],
            "two": [-1, "nd"],
            "few": [-1, "rd"],
            "other": [-1, "th"]
        }
    ],
    "!"
] satisfies CompiledAst;
console.log(run(place, enUS, { place: 1 }, formatters));