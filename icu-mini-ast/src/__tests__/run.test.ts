import { de, en } from "@messageformat/runtime/lib/cardinals";
import { en as enOd, de as deOd } from "make-plural/ordinals";
import { compileToJson } from "../compile";
import { run } from "../run";
import { test, expect } from "vitest";

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

test("plural", () => {
    const json = compileToJson(`{count, plural, one {# Bild} other {# Bilder} }`);
    expect(run(json, deDE ,{ count: 0 })).toBe("0 Bilder");
    expect(run(json, deDE,{ count: 1 })).toBe("1 Bild");
    expect(run(json, deDE,{ count: 2 })).toBe("2 Bilder");
});

test("selectordinal", () => {
    const json = compileToJson(`You finished {place, selectordinal,
        one   {#st}
        two   {#nd}
        few   {#rd}
        other {#th}
    }!`);
    expect(run(json, enUS, { place: 1 })).toBe("You finished 1st!");
    expect(run(json, enUS, { place: 2 })).toBe("You finished 2nd!");
    expect(run(json, enUS, { place: 3 })).toBe("You finished 3rd!");
    expect(run(json, enUS, { place: 4 })).toBe("You finished 4th!");
});