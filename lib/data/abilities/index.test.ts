import { describe, expect, it, test } from "vitest";

import { findDuplicateIds } from "../testHelper";

import { abilityDataList, isAbilityDataId } from ".";

describe("abilityDataList", () => {
  it("アビリティの id が重複していない", () => {
    expect(findDuplicateIds(abilityDataList)).toStrictEqual([]);
  });

  describe("id", () => {
    test.each(abilityDataList)("$id は命名規則に従う", (ability) => {
      expect(ability.id).toMatch(/^([a-z][a-zA-Z0-9]*:)?[a-z][a-zA-Z0-9]*$/);
    });
  });
});

describe("isAbilityDataId", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isAbilityDataId>;
    expected: ReturnType<typeof isAbilityDataId>;
  }>([
    {
      name: "定義されている ID なら true を返す",
      args: ["lueck:albedoChieftainsDaughter"],
      expected: true,
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
    expect(isAbilityDataId(...args)).toBe(expected);
  });
});
