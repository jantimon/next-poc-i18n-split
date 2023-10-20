import { de, en } from "@messageformat/runtime/lib/cardinals";
import { date, time } from "@messageformat/runtime/lib/formatters";
import { en as enOd, de as deOd } from "make-plural/ordinals";
import { compileToJson } from "../compile";
import { evaluateAst, run } from "../run";
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
    expect(run(json, deDE, { count: 0 })).toBe("0 Bilder");
    expect(run(json, deDE, { count: 1 })).toBe("1 Bild");
    expect(run(json, deDE, { count: 2 })).toBe("2 Bilder");
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

test("fn", () => {
    const json = compileToJson(`It is now {T, time} on {T, date}`);
    expect(run(json, enUS, { T: new Date("2000-01-01 12:23:34") }, {
        time,
        date
    }))
        .toEqual(`It is now 12:23:34 PM on Jan 1, 2000`);
});


test("evaluateAst with non string argument", () => {
    const json = compileToJson(`Hello {name}!`);
    expect(evaluateAst(json, enUS, {
        name: ["World"]
    }, {}))
        .toEqual(["Hello ",
            [
                "World",
            ],
            "!"]);
});

// `Wow formatJs allows <b>{dynamic} tags</b>!`
test("tags", () => {
    const json = compileToJson(`Wow formatJs allows <b>{dynamic} tags</b>!`);
    expect(run(json, enUS, {
        dynamic: "flexible",
        b: (children) => `<strong>${children}</strong>`
    }, {})).toEqual(`Wow formatJs allows <strong>flexible tags</strong>!`);
});