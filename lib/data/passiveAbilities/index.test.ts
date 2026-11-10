import { describe, expect, it, test } from "vitest";

import { findDuplicates } from "../testHelper";

import { isPassiveAbilityDataId, passiveAbilityDataList } from ".";

describe("passiveAbilityDataList", () => {
  it("パッシブアビリティの id が重複していない", () => {
    expect(
      findDuplicates(passiveAbilityDataList.map((ability) => ability.id)),
    ).toStrictEqual([]);
  });

  describe("id", () => {
    test.each(passiveAbilityDataList)("$id は命名規則に従う", (ability) => {
      expect(ability.id).toMatch(/^([a-z]+:[a-z0-9]+:)?[a-z0-9]+$/);
    });
  });
});

describe("isPassiveAbilityDataId", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isPassiveAbilityDataId>;
    expected: ReturnType<typeof isPassiveAbilityDataId>;
  }>([
    {
      name: "定義されている ID なら true を返す",
      args: ["scholar:ryukku:arubedozokuchounomusume"],
      expected: true,
    },
    {
      name: "アクティブアビリティの ID なら false を返す",
      args: ["scholar:ryukku:chougouburasutaamain"],
      expected: false,
    },
    {
      name: "定義されていない ID なら false を返す",
      args: ["unknown"],
      expected: false,
    },
    {
      name: "Object のプロトタイプのプロパティ名なら false を返す",
      args: ["toString"],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isPassiveAbilityDataId(...args)).toBe(expected);
  });
});
