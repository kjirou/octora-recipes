import { describe, expect, test } from "vitest";

import { createDataDict } from "./dataDefinitionUtils";

type Item = { id: string; n: number };

describe("createDataDict", () => {
  test.each<{
    name: string;
    args: [ReadonlyArray<Item>, keyof Item];
    expected: Readonly<Record<string, Item>>;
  }>([
    {
      name: "指定したキーの値をキーにした辞書を返す",
      args: [
        [
          { id: "a", n: 1 },
          { id: "b", n: 2 },
        ],
        "id",
      ],
      expected: { a: { id: "a", n: 1 }, b: { id: "b", n: 2 } },
    },
    {
      name: "キーの値が重複している場合は後のものが残る",
      args: [
        [
          { id: "a", n: 1 },
          { id: "a", n: 2 },
        ],
        "id",
      ],
      expected: { a: { id: "a", n: 2 } },
    },
    {
      name: "空の一覧からは空の辞書を返す",
      args: [[], "id"],
      expected: {},
    },
  ])("$name", ({ args, expected }) => {
    expect(createDataDict<string, Item>(...args)).toStrictEqual(expected);
  });
});
