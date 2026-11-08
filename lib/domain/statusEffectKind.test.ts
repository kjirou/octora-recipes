import { describe, expect, it, test } from "vitest";

import {
  STATUS_EFFECT_KIND_DEFINITIONS,
  getStatusEffectKindDefinition,
  getStatusEffectPolarity,
  listStatusEffectKinds,
} from "./statusEffectKind";

describe("STATUS_EFFECT_KIND_DEFINITIONS", () => {
  it("キーと定義内の kind が一致している", () => {
    for (const [key, definition] of Object.entries(
      STATUS_EFFECT_KIND_DEFINITIONS,
    )) {
      expect(definition.kind).toBe(key);
    }
  });

  it("表示名が重複していない", () => {
    const names = Object.values(STATUS_EFFECT_KIND_DEFINITIONS).map(
      (definition) => definition.name,
    );
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("listStatusEffectKinds", () => {
  it("すべての種別を ASCII 順で返す", () => {
    const kinds = listStatusEffectKinds();
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(12);
  });
});

describe("getStatusEffectKindDefinition", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectKindDefinition>;
    expected: ReturnType<typeof getStatusEffectKindDefinition>;
  }>([
    {
      name: "物攻アップの定義を返す",
      args: ["physicalAttackUp"],
      expected: {
        kind: "physicalAttackUp",
        name: "物攻アップ",
        polarity: "buff",
      },
    },
    {
      name: "速度ダウンの定義を返す",
      args: ["speedDown"],
      expected: { kind: "speedDown", name: "速度ダウン", polarity: "debuff" },
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectKindDefinition(...args)).toStrictEqual(expected);
  });
});

describe("getStatusEffectPolarity", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectPolarity>;
    expected: ReturnType<typeof getStatusEffectPolarity>;
  }>([
    {
      name: "会心ダウンはデバフ",
      args: ["criticalRateDown"],
      expected: "debuff",
    },
    { name: "会心アップはバフ", args: ["criticalRateUp"], expected: "buff" },
    {
      name: "属攻ダウンはデバフ",
      args: ["elementalAttackDown"],
      expected: "debuff",
    },
    { name: "属攻アップはバフ", args: ["elementalAttackUp"], expected: "buff" },
    {
      name: "属防ダウンはデバフ",
      args: ["elementalDefenseDown"],
      expected: "debuff",
    },
    {
      name: "属防アップはバフ",
      args: ["elementalDefenseUp"],
      expected: "buff",
    },
    {
      name: "物攻ダウンはデバフ",
      args: ["physicalAttackDown"],
      expected: "debuff",
    },
    { name: "物攻アップはバフ", args: ["physicalAttackUp"], expected: "buff" },
    {
      name: "物防ダウンはデバフ",
      args: ["physicalDefenseDown"],
      expected: "debuff",
    },
    {
      name: "物防アップはバフ",
      args: ["physicalDefenseUp"],
      expected: "buff",
    },
    { name: "速度ダウンはデバフ", args: ["speedDown"], expected: "debuff" },
    { name: "速度アップはバフ", args: ["speedUp"], expected: "buff" },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectPolarity(...args)).toBe(expected);
  });
});
