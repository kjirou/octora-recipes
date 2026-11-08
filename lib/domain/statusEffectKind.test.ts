import { describe, expect, it, test } from "vitest";

import {
  ATTACK_TYPE_DAMAGE_UP_KINDS,
  DAMAGE_CAP_UP_KIND_DEFINITIONS,
  DAMAGE_UP_KIND_DEFINITIONS,
  STATUS_EFFECT_KIND_DEFINITIONS,
  getAttackTypeDamageUpKind,
  getStatusEffectKindDefinition,
  getStatusEffectPolarity,
  isDamageCapUpStatusEffectKind,
  isDamageUpStatusEffectKind,
  listDamageCapUpKindDefinitions,
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

describe("ATTACK_TYPE_DAMAGE_UP_KINDS", () => {
  it("対応表の種別は、定義上その攻撃種別を対象にしている", () => {
    for (const [attackType, kind] of Object.entries(
      ATTACK_TYPE_DAMAGE_UP_KINDS,
    )) {
      expect(DAMAGE_UP_KIND_DEFINITIONS[kind].target).toStrictEqual({
        type: "attackType",
        attackType,
      });
    }
  });

  it("攻撃種別を対象にする定義は、すべて対応表に含まれる", () => {
    const attackTypeKinds = listDamageUpKindDefinitions()
      .filter(({ target }) => target.type === "attackType")
      .map(({ kind }) => kind);
    expect(Object.values(ATTACK_TYPE_DAMAGE_UP_KINDS).sort()).toStrictEqual(
      attackTypeKinds,
    );
  });
});

describe("DAMAGE_CAP_UP_KIND_DEFINITIONS", () => {
  it("キーと定義内の kind が一致している", () => {
    for (const [key, definition] of Object.entries(
      DAMAGE_CAP_UP_KIND_DEFINITIONS,
    )) {
      expect(definition.kind).toBe(key);
    }
  });

  it("ダメージ上限アップ系の種別はすべて、効果量が絶対値で上限の無いバフ", () => {
    for (const { kind } of Object.values(DAMAGE_CAP_UP_KIND_DEFINITIONS)) {
      expect(getStatusEffectKindDefinition(kind)).toMatchObject({
        polarity: "buff",
        magnitudeUnit: "absolute",
        defaultMagnitudeCap: null,
      });
    }
  });

  it("攻撃種別を対象にする定義は、攻撃種別 14 種のそれぞれに 1 つずつある", () => {
    const attackTypes = listDamageCapUpKindDefinitions().flatMap(
      ({ target }) => (target.type === "attackType" ? [target.attackType] : []),
    );
    expect(attackTypes.sort()).toStrictEqual(
      Object.keys(ATTACK_TYPE_DAMAGE_UP_KINDS).sort(),
    );
  });
});

describe("listStatusEffectKinds", () => {
  it("すべての種別を ASCII 順で返す", () => {
    const kinds = listStatusEffectKinds();
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(49);
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
        magnitudeUnit: "percent",
        defaultMagnitudeCap: 30,
      },
    },
    {
      name: "速度ダウンの定義を返す",
      args: ["speedDown"],
      expected: {
        kind: "speedDown",
        name: "速度ダウン",
        polarity: "debuff",
        magnitudeUnit: "percent",
        defaultMagnitudeCap: 30,
      },
    },
    {
      name: "剣攻撃ダメージアップの定義を返す",
      args: ["swordDamageUp"],
      expected: {
        kind: "swordDamageUp",
        name: "剣攻撃ダメージアップ",
        polarity: "buff",
        magnitudeUnit: "percent",
        defaultMagnitudeCap: 30,
      },
    },
    {
      name: "ダメージ上限アップの定義を返す",
      args: ["damageCapUp"],
      expected: {
        kind: "damageCapUp",
        name: "ダメージ上限アップ",
        polarity: "buff",
        magnitudeUnit: "absolute",
        defaultMagnitudeCap: null,
      },
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
    {
      name: "ダメージ上限アップはダメージアップ系ではない",
      args: ["damageCapUp"],
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

describe("isDamageCapUpStatusEffectKind", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isDamageCapUpStatusEffectKind>;
    expected: ReturnType<typeof isDamageCapUpStatusEffectKind>;
  }>([
    {
      name: "ダメージ上限アップ（全攻撃）はダメージ上限アップ系",
      args: ["damageCapUp"],
      expected: true,
    },
    {
      name: "氷属性ダメージ上限アップはダメージ上限アップ系",
      args: ["iceDamageCapUp"],
      expected: true,
    },
    {
      name: "ダメージアップ（全攻撃）はダメージ上限アップ系ではない",
      args: ["damageUp"],
      expected: false,
    },
    {
      name: "物攻アップはダメージ上限アップ系ではない",
      args: ["physicalAttackUp"],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isDamageCapUpStatusEffectKind(...args)).toBe(expected);
  });
});

describe("listDamageCapUpKindDefinitions", () => {
  it("17 種の定義を ASCII 順で返す", () => {
    const kinds = listDamageCapUpKindDefinitions().map(
      (definition) => definition.kind,
    );
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(17);
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
});
