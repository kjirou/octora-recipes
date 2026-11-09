import { describe, expect, test } from "vitest";

import { findDuplicates } from "./testHelper";

describe("findDuplicates", () => {
  test.each<{
    name: string;
    args: Parameters<typeof findDuplicates>;
    expected: ReturnType<typeof findDuplicates>;
  }>([
    {
      name: "重複が無ければ空配列を返す",
      args: [["a", "b"]],
      expected: [],
    },
    {
      name: "2 回目以降に現れた値を現れた順に返す",
      args: [["a", "b", "b", "a", "a"]],
      expected: ["b", "a", "a"],
    },
  ])("$name", ({ args, expected }) => {
    expect(findDuplicates(...args)).toStrictEqual(expected);
  });
});
