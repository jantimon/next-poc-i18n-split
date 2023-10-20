
import { compileToJson } from "../compile";
import { test, expect } from "vitest";

test("plural", () => {
    const json = compileToJson(`{count, plural, one {# Bild} other {# Bilder} }`);
    expect(json).toEqual([
        ["count"],
        [
            "plural",
            0,
            {
                "one": [-1, " Bild"],
                "other": [-1, " Bilder"]
            }
        ]
    ]);
});

test("selectordinal", () => {
    const json = compileToJson(`You finished {place, selectordinal,
        one   {#st}
        two   {#nd}
        few   {#rd}
        other {#th}
    }!`);
    expect(json).toEqual([
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
    ]);
   
});

test("fn", () => {
   const json = compileToJson(`It is now {T, time} on {T, date}`);
   expect(json).toEqual([
       ["T"],
       "It is now ",
       [
           "fn",
           0,
           "time"
       ],
       " on ",
       [
           "fn",
           0,
           "date"
       ]
   ]);
});