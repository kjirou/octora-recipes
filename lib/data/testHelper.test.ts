import { describe, expect, test } from "vitest";

import { findDuplicateIds } from "./testHelper";

describe("findDuplicateIds", () => {
  test.each<{
    name: string;
    args: Parameters<typeof findDuplicateIds>;
    expected: ReturnType<typeof findDuplicateIds>;
  }>([
    {
      name: "重複が無ければ空配列を返す",
      args: [[{ id: "a" }, { id: "b" }]],
      expected: [],
    },
    {
      name: "2 回目以降に現れた ID を現れた順に返す",
      args: [[{ id: "a" }, { id: "b" }, { id: "b" }, { id: "a" }, { id: "a" }]],
      expected: ["b", "a", "a"],
    },
  ])("$name", ({ args, expected }) => {
    expect(findDuplicateIds(...args)).toStrictEqual(expected);
  });
});
