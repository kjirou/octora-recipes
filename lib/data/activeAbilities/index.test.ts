import { describe, expect, it, test } from "vitest";

import { findDuplicates } from "../testHelper";

import { activeAbilityDataList, isActiveAbilityDataId } from ".";

describe("activeAbilityDataList", () => {
  it("アクティブアビリティの id が重複していない", () => {
    expect(
      findDuplicates(activeAbilityDataList.map((ability) => ability.id)),
    ).toStrictEqual([]);
  });

  describe("id", () => {
    test.each(activeAbilityDataList)("$id は命名規則に従う", (ability) => {
      expect(ability.id).toMatch(/^([a-z][a-zA-Z0-9]*:)?[a-z][a-zA-Z0-9]*$/);
    });
  });
});

describe("isActiveAbilityDataId", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isActiveAbilityDataId>;
    expected: ReturnType<typeof isActiveAbilityDataId>;
  }>([
    {
      name: "定義されている ID なら true を返す",
      args: ["lueck:mixBlasterMine"],
      expected: true,
    },
    {
      name: "パッシブアビリティの ID なら false を返す",
      args: ["lueck:albedoChieftainsDaughter"],
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
    expect(isActiveAbilityDataId(...args)).toBe(expected);
  });
});
