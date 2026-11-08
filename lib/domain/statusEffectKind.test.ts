import { describe, expect, it, test } from "vitest";

import type { AttackType } from "@/lib/types";

import {
  DAMAGE_UP_KIND_DEFINITIONS,
  STATUS_EFFECT_KIND_DEFINITIONS,
  getAttackTypeDamageUpKind,
  getStatusEffectKindDefinition,
  getStatusEffectPolarity,
  isDamageUpStatusEffectKind,
  listDamageUpKindDefinitions,
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

describe("DAMAGE_UP_KIND_DEFINITIONS", () => {
  it("キーと定義内の kind が一致している", () => {
    for (const [key, definition] of Object.entries(
      DAMAGE_UP_KIND_DEFINITIONS,
    )) {
      expect(definition.kind).toBe(key);
    }
  });

  it("ダメージアップ系の種別はすべてバフ", () => {
    for (const { kind } of Object.values(DAMAGE_UP_KIND_DEFINITIONS)) {
      expect(getStatusEffectPolarity(kind)).toBe("buff");
    }
  });
});

describe("listStatusEffectKinds", () => {
  it("すべての種別を ASCII 順で返す", () => {
    const kinds = listStatusEffectKinds();
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(32);
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

describe("isDamageUpStatusEffectKind", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isDamageUpStatusEffectKind>;
    expected: ReturnType<typeof isDamageUpStatusEffectKind>;
  }>([
    {
      name: "剣攻撃ダメージアップはダメージアップ系",
      args: ["swordDamageUp"],
      expected: true,
    },
    {
      name: "ダメージアップ（全攻撃）はダメージアップ系",
      args: ["damageUp"],
      expected: true,
    },
    {
      name: "弱点時ダメージアップはダメージアップ系",
      args: ["weaknessDamageUp"],
      expected: true,
    },
    {
      name: "物攻アップはダメージアップ系ではない",
      args: ["physicalAttackUp"],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isDamageUpStatusEffectKind(...args)).toBe(expected);
  });
});

describe("listDamageUpKindDefinitions", () => {
  it("20 種の定義を ASCII 順で返す", () => {
    const kinds = listDamageUpKindDefinitions().map(
      (definition) => definition.kind,
    );
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(20);
  });
});

describe("getAttackTypeDamageUpKind", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getAttackTypeDamageUpKind>;
    expected: ReturnType<typeof getAttackTypeDamageUpKind>;
  }>([
    {
      name: "剣は剣攻撃ダメージアップ",
      args: ["sword"],
      expected: "swordDamageUp",
    },
    {
      name: "扇は扇攻撃ダメージアップ",
      args: ["fan"],
      expected: "fanDamageUp",
    },
    {
      name: "氷は氷属性ダメージアップ",
      args: ["ice"],
      expected: "iceDamageUp",
    },
    {
      name: "雷は雷属性ダメージアップ",
      args: ["lightning"],
      expected: "lightningDamageUp",
    },
  ])("$name", ({ args, expected }) => {
    expect(getAttackTypeDamageUpKind(...args)).toBe(expected);
  });

  it("攻撃種別 14 種がそれぞれ別の種別に対応する", () => {
    const attackTypes: AttackType[] = [
      "axe",
      "book",
      "bow",
      "dagger",
      "fan",
      "spear",
      "staff",
      "sword",
      "dark",
      "fire",
      "ice",
      "light",
      "lightning",
      "wind",
    ];
    const kinds = attackTypes.map(getAttackTypeDamageUpKind);
    expect(new Set(kinds).size).toBe(14);
  });
});
