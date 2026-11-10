import { describe, expect, it, test } from "vitest";

import type {
  StatusEffectApplication,
  StatusEffectDuration,
  StatusEffectMagnitudeCap,
  StatusEffectMagnitudeCapApplication,
  StatusEffectPool,
  StatusEffectSource,
  StatusEffectState,
} from "@/lib/types";

import {
  applyStatusEffect,
  applyStatusEffectMagnitudeCap,
  createEmptyStatusEffectState,
  elapseStatusEffectTurn,
  findStatusEffectPool,
  getDamageCapUpMagnitude,
  getDamageUpMagnitude,
  getResistanceMagnitude,
  getStatusEffectMagnitude,
  getStatusEffectMagnitudeCap,
  getStatusEffectRemainingTurns,
  isSameStatusEffectSource,
  listApplicableDamageCapUpKinds,
  listApplicableDamageUpKinds,
  listApplicableResistanceKinds,
  removePermanentStatusEffect,
} from "./statusEffect";

const permanent: StatusEffectDuration = { type: "permanent" };
const turns = (turns: number): StatusEffectDuration => ({
  type: "turns",
  turns,
});

const violaAntiAttack2: StatusEffectSource = {
  type: "activeAbility",
  characterId: "thief:viora",
  abilityId: "antiAttack2",
};
const therionTenso: StatusEffectSource = {
  type: "activeAbility",
  characterId: "thief:terion",
  abilityId: "tenso",
};
const sourceA: StatusEffectSource = {
  type: "activeAbility",
  characterId: "a",
  abilityId: "a",
};
const sourceB: StatusEffectSource = {
  type: "activeAbility",
  characterId: "b",
  abilityId: "b",
};
const permanentSource1: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "p",
  abilityId: "p1",
};
const permanentSource2: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "p",
  abilityId: "p2",
};
const timedSource1: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "t",
  abilityId: "t1",
};
const lueckAlbedoChiefsDaughter: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "scholar:ryukku",
  abilityId: "albedoChiefsDaughter",
};
const lueckBlasterMine: StatusEffectSource = {
  type: "activeAbility",
  characterId: "scholar:ryukku",
  abilityId: "blasterMine",
};
const rocbouquetTemptation: StatusEffectSource = {
  type: "activeAbility",
  characterId: "dancer:shichieiyuurokkubuuke",
  abilityId: "temptationEx",
};
const augusteDeepGreenEnsemble: StatusEffectSource = {
  type: "activeAbility",
  characterId: "scholar:aagyusuto",
  abilityId: "deepGreenEnsembleTorch",
};
const violaLikeRagingFire: StatusEffectSource = {
  type: "activeAbility",
  characterId: "warrior:viora",
  abilityId: "likeRagingFire",
};
const violaHeirOfDivineWeapon: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "warrior:viora",
  abilityId: "heirOfDivineWeapon",
};
const soniaSaltarello: StatusEffectSource = {
  type: "activeAbility",
  characterId: "apothecary:sonia",
  abilityId: "braveAxeSaltarello",
};
const molussoLiven: StatusEffectSource = {
  type: "activeAbility",
  characterId: "dancer:morurusso",
  abilityId: "liven",
};
const crimsonCondemnerAura: StatusEffectSource = {
  type: "activeAbility",
  characterId: "cleric:akakidanzaisha",
  abilityId: "auraOfRedHeartAll5",
};
const rocbouquetSingleMindedLove: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "dancer:shichieiyuurokkubuuke",
  abilityId: "singleMindedLove",
};
/** 覚醒アクセサリー「真心のポーチ」。装備者（自身）にだけ掛かる。 */
const finalEmpressSincerityPouch: StatusEffectSource = {
  type: "equipment",
  characterId: "scholar:saishuukouteionna",
  equipmentId: "sincerityPouch",
};

const lueckBaor: StatusEffectSource = {
  type: "activeAbility",
  characterId: "scholar:ryukku",
  abilityId: "baor",
};
const linyuBreathOfTheSea: StatusEffectSource = {
  type: "activeAbility",
  characterId: "dancer:rinyuu",
  abilityId: "breathOfTheSea",
};
const osvaldPriceOfMagic: StatusEffectSource = {
  type: "activeAbility",
  characterId: "cleric:ozubarudo",
  abilityId: "priceOfMagic",
};
const rocbouquetPassionPerfume: StatusEffectSource = {
  type: "activeAbility",
  characterId: "dancer:shichieiyuurokkubuuke",
  abilityId: "passionPerfume",
};
const frenziedFoolRisingRebellion: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "merchant:kyousounogusha",
  abilityId: "risingRebellionTorch",
};
const frenziedFoolPlundererFury: StatusEffectSource = {
  type: "activeAbility",
  characterId: "merchant:kyousounogusha",
  abilityId: "plundererFury",
};
const frenziedFoolPlunderSpear: StatusEffectSource = {
  type: "activeAbility",
  characterId: "merchant:kyousounogusha",
  abilityId: "plunderSpear",
};
const rocbouquetEnticingInvitation: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "dancer:shichieiyuurokkubuuke",
  abilityId: "enticingInvitationTorch",
};
const linyuMermaidsSorrow: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "dancer:rinyuu",
  abilityId: "mermaidsSorrow",
};

/** テスト用に、省略可能な項目を埋めた付与内容を作る。 */
const createApplication = (
  overrides: Partial<StatusEffectApplication> = {},
): StatusEffectApplication => ({
  slot: "battleAbility",
  kind: "physicalAttackDown",
  magnitude: 20,
  duration: turns(2),
  source: violaAntiAttack2,
  ...overrides,
});

/** テスト用に、省略可能な項目を埋めた上限引き上げの付与内容を作る。 */
const createCapApplication = (
  overrides: Partial<StatusEffectMagnitudeCapApplication> = {},
): StatusEffectMagnitudeCapApplication => ({
  slot: "battleAbility",
  kind: "physicalDefenseDown",
  cap: 50,
  duration: turns(3),
  source: lueckBlasterMine,
  ...overrides,
});

/** テスト用に、省略可能な項目を埋めたまとまりを作る。 */
const createPool = (
  overrides: Partial<StatusEffectPool> = {},
): StatusEffectPool => ({
  slot: "battleAbility",
  kind: "physicalAttackDown",
  permanentSources: [],
  timedMagnitude: 0,
  remainingTurns: 0,
  timedSources: [],
  ...overrides,
});

/** テスト用に、省略可能な項目を埋めた上限引き上げ効果を作る。 */
const createCap = (
  overrides: Partial<StatusEffectMagnitudeCap> = {},
): StatusEffectMagnitudeCap => ({
  slot: "battleAbility",
  kind: "physicalDefenseDown",
  cap: 50,
  remainingTurns: 3,
  source: lueckBlasterMine,
  ...overrides,
});

/** テスト用に、まとまりと上限引き上げ効果から状態を作る。 */
const createState = (
  pools: StatusEffectPool[] = [],
  magnitudeCaps: StatusEffectMagnitudeCap[] = [],
): StatusEffectState => ({ pools, magnitudeCaps });

/** 付与内容を順に適用した結果を返す。 */
const applyAll = (
  applications: StatusEffectApplication[],
  initial: StatusEffectState = createEmptyStatusEffectState(),
): StatusEffectState =>
  applications.reduce(
    (state, application) => applyStatusEffect(state, application),
    initial,
  );

/** 上限引き上げの付与内容を順に適用した結果を返す。 */
const applyAllCaps = (
  applications: StatusEffectMagnitudeCapApplication[],
  initial: StatusEffectState = createEmptyStatusEffectState(),
): StatusEffectState =>
  applications.reduce(
    (state, application) => applyStatusEffectMagnitudeCap(state, application),
    initial,
  );

/**
 * 踊子 リンユウEX「大海の息吹」（200% 発動時）: 味方前後衛全体に「氷・風・光属性」のいずれかで攻撃時
 * ダメージ上限アップ（効果量 100000）（6 ターン）。攻撃種別ごとに 1 つずつ付与する。
 */
const breathOfTheSeaApplications: StatusEffectApplication[] = (
  ["iceDamageCapUp", "windDamageCapUp", "lightDamageCapUp"] as const
).map((kind) =>
  createApplication({
    slot: "ultimate",
    kind,
    magnitude: 100000,
    duration: turns(6),
    source: linyuBreathOfTheSea,
  }),
);

/**
 * 狂騒の愚者「満ちる叛意 灯火」: 敵全体に槍・斧・闇耐性ダウン 15%（ターン無し）。
 * 攻撃種別ごとに 1 つずつ付与する。
 */
const risingRebellionApplications: StatusEffectApplication[] = (
  ["spearResistanceDown", "axeResistanceDown", "darkResistanceDown"] as const
).map((kind) =>
  createApplication({
    slot: "supportAbility",
    kind,
    magnitude: 15,
    duration: permanent,
    source: frenziedFoolRisingRebellion,
  }),
);

/**
 * 狂騒の愚者「満ちる叛意 灯火」: バトアビによる / サポアビと装備性能による 槍・斧・闇耐性ダウンを
 * 受けた際の上限が 60% になる効果（ターン無し）。3 種別 × 2 枠の 6 件。
 */
const risingRebellionCaps: StatusEffectMagnitudeCapApplication[] = (
  ["battleAbility", "supportAbility"] as const
).flatMap((slot) =>
  (
    ["spearResistanceDown", "axeResistanceDown", "darkResistanceDown"] as const
  ).map((kind) =>
    createCapApplication({
      slot,
      kind,
      cap: 60,
      duration: permanent,
      source: frenziedFoolRisingRebellion,
    }),
  ),
);

/** 狂騒の愚者「略奪者の猛り」: 敵全体に槍耐性ダウン 15%（2 ターン）。 */
const plundererFuryApplication: StatusEffectApplication = createApplication({
  kind: "spearResistanceDown",
  magnitude: 15,
  duration: turns(2),
  source: frenziedFoolPlundererFury,
});

/** 狂騒の愚者「強奪の槍」: 攻撃対象に物理耐性ダウン 15%（2 ターン）。 */
const plunderSpearApplication: StatusEffectApplication = createApplication({
  kind: "physicalResistanceDown",
  magnitude: 15,
  duration: turns(2),
  source: frenziedFoolPlunderSpear,
});

/** 七英雄ロックブーケ「魅惑の誘い 灯火」: 敵全体に属性耐性ダウン 20%（ターン無し）。 */
const enticingInvitationApplication: StatusEffectApplication =
  createApplication({
    slot: "supportAbility",
    kind: "elementalResistanceDown",
    magnitude: 20,
    duration: permanent,
    source: rocbouquetEnticingInvitation,
  });

/**
 * 七英雄ロックブーケ「魅惑の誘い 灯火」: サポアビと装備性能による属性耐性ダウンを受けた際の
 * 上限が 50% になる効果（ターン無し）。属性 6 種の種別に 1 件ずつ。
 */
const enticingInvitationCaps: StatusEffectMagnitudeCapApplication[] = (
  [
    "darkResistanceDown",
    "fireResistanceDown",
    "iceResistanceDown",
    "lightResistanceDown",
    "lightningResistanceDown",
    "windResistanceDown",
  ] as const
).map((kind) =>
  createCapApplication({
    slot: "supportAbility",
    kind,
    cap: 50,
    duration: permanent,
    source: rocbouquetEnticingInvitation,
  }),
);

/** 踊子 リンユウEX「人魚の悲情」: 敵全体に氷・風・光耐性ダウン 30%（3 ターン）。 */
const mermaidsSorrowApplications: StatusEffectApplication[] = (
  ["iceResistanceDown", "windResistanceDown", "lightResistanceDown"] as const
).map((kind) =>
  createApplication({
    slot: "supportAbility",
    kind,
    magnitude: 30,
    duration: turns(3),
    source: linyuMermaidsSorrow,
  }),
);

/**
 * 踊子 リンユウEX「人魚の悲情」: バトアビによる / サポアビと装備性能による 氷・風・光耐性ダウンを
 * 受けた際の上限が 50% になる効果（3 ターン）。3 種別 × 2 枠の 6 件。
 */
const mermaidsSorrowCaps: StatusEffectMagnitudeCapApplication[] = (
  ["battleAbility", "supportAbility"] as const
).flatMap((slot) =>
  (
    ["iceResistanceDown", "windResistanceDown", "lightResistanceDown"] as const
  ).map((kind) =>
    createCapApplication({
      slot,
      kind,
      cap: 50,
      duration: turns(3),
      source: linyuMermaidsSorrow,
    }),
  ),
);

/** リュック「調合：バオール」: 味方単体に属性耐性アップ 30%（2 ターン）。 */
const baorResistanceApplication: StatusEffectApplication = createApplication({
  kind: "elementalResistanceUp",
  magnitude: 30,
  duration: turns(2),
  source: lueckBaor,
});

describe("createEmptyStatusEffectState", () => {
  it("まとまりも上限引き上げ効果も無い状態を返す", () => {
    expect(createEmptyStatusEffectState()).toStrictEqual({
      pools: [],
      magnitudeCaps: [],
    });
  });
});

describe("isSameStatusEffectSource", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isSameStatusEffectSource>;
    expected: ReturnType<typeof isSameStatusEffectSource>;
  }>([
    {
      name: "キャラとアビリティが同じなら同じ付与元",
      args: [
        violaAntiAttack2,
        {
          type: "activeAbility",
          characterId: "thief:viora",
          abilityId: "antiAttack2",
        },
      ],
      expected: true,
    },
    {
      name: "同名アビリティでもキャラが違えば別の付与元",
      args: [
        {
          type: "activeAbility",
          characterId: "thief:kuresu",
          abilityId: "backstab",
        },
        {
          type: "activeAbility",
          characterId: "thief:dyuran",
          abilityId: "backstab",
        },
      ],
      expected: false,
    },
    {
      name: "同じキャラでもアビリティが違えば別の付与元",
      args: [
        violaAntiAttack2,
        {
          type: "activeAbility",
          characterId: "thief:viora",
          abilityId: "other",
        },
      ],
      expected: false,
    },
    {
      name: "区別が片方にだけあれば別の付与元",
      args: [violaAntiAttack2, { ...violaAntiAttack2, variant: "boostMax" }],
      expected: false,
    },
    {
      name: "区別まで同じなら同じ付与元",
      args: [
        { ...violaAntiAttack2, variant: "boostMax" },
        { ...violaAntiAttack2, variant: "boostMax" },
      ],
      expected: true,
    },
    {
      name: "キャラとアビリティ ID が同じでも、アクティブとパッシブなら別の付与元",
      args: [
        {
          type: "activeAbility",
          characterId: "thief:viora",
          abilityId: "same",
        },
        {
          type: "passiveAbility",
          characterId: "thief:viora",
          abilityId: "same",
        },
      ],
      expected: false,
    },
    {
      name: "パッシブアビリティはキャラとアビリティが同じなら同じ付与元",
      args: [lueckAlbedoChiefsDaughter, { ...lueckAlbedoChiefsDaughter }],
      expected: true,
    },
    {
      name: "パッシブアビリティはキャラが違えば別の付与元",
      args: [
        lueckAlbedoChiefsDaughter,
        { ...lueckAlbedoChiefsDaughter, characterId: "other" },
      ],
      expected: false,
    },
    {
      name: "パッシブアビリティはアビリティが違えば別の付与元",
      args: [
        lueckAlbedoChiefsDaughter,
        { ...lueckAlbedoChiefsDaughter, abilityId: "other" },
      ],
      expected: false,
    },
    {
      name: "装備品はキャラと装備品が同じなら同じ付与元",
      args: [finalEmpressSincerityPouch, { ...finalEmpressSincerityPouch }],
      expected: true,
    },
    {
      name: "装備品はキャラが違えば別の付与元",
      args: [
        finalEmpressSincerityPouch,
        { ...finalEmpressSincerityPouch, characterId: "other" },
      ],
      expected: false,
    },
    {
      name: "装備品は装備品が違えば別の付与元",
      args: [
        finalEmpressSincerityPouch,
        { ...finalEmpressSincerityPouch, equipmentId: "other" },
      ],
      expected: false,
    },
    {
      name: "装備品とアビリティは別の付与元",
      args: [
        { type: "equipment", characterId: "thief:viora", equipmentId: "same" },
        {
          type: "passiveAbility",
          characterId: "thief:viora",
          abilityId: "same",
        },
      ],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isSameStatusEffectSource(...args)).toBe(expected);
  });
});

describe("findStatusEffectPool", () => {
  const state = applyAll([
    createApplication(),
    createApplication({ kind: "physicalAttackUp", source: sourceA }),
    createApplication({ slot: "ultimate", source: sourceB }),
  ]);

  test.each<{
    name: string;
    args: Parameters<typeof findStatusEffectPool>;
    expected: ReturnType<typeof findStatusEffectPool>;
  }>([
    {
      name: "枠・種別が一致するまとまりを返す",
      args: [state, "battleAbility", "physicalAttackDown"],
      expected: createPool({
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [violaAntiAttack2],
      }),
    },
    {
      name: "種別が違えば別のまとまりを返す",
      args: [state, "battleAbility", "physicalAttackUp"],
      expected: createPool({
        kind: "physicalAttackUp",
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [sourceA],
      }),
    },
    {
      name: "枠が違えば別のまとまりを返す",
      args: [state, "ultimate", "physicalAttackDown"],
      expected: createPool({
        slot: "ultimate",
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [sourceB],
      }),
    },
    {
      name: "一致するまとまりが無ければ undefined",
      args: [state, "battleAbility", "elementalAttackDown"],
      expected: undefined,
    },
    {
      name: "空の状態なら undefined",
      args: [
        createEmptyStatusEffectState(),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: undefined,
    },
  ])("$name", ({ args, expected }) => {
    expect(findStatusEffectPool(...args)).toStrictEqual(expected);
  });
});

describe("getStatusEffectMagnitudeCap", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectMagnitudeCap>;
    expected: ReturnType<typeof getStatusEffectMagnitudeCap>;
  }>([
    {
      name: "上限引き上げ効果が無ければ 30",
      args: [
        createEmptyStatusEffectState(),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 30,
    },
    {
      name: "枠・種別が一致する上限引き上げ効果の値を返す",
      args: [
        applyAllCaps([createCapApplication({ cap: 50 })]),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 50,
    },
    {
      name: "枠が違う上限引き上げ効果は適用されない",
      args: [
        applyAllCaps([createCapApplication({ slot: "supportAbility" })]),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 30,
    },
    {
      name: "種別が違う上限引き上げ効果は適用されない",
      args: [
        applyAllCaps([createCapApplication({ kind: "elementalDefenseDown" })]),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 30,
    },
    {
      name: "複数あれば最も高い上限が有効",
      args: [
        applyAllCaps([
          createCapApplication({ cap: 50, source: lueckBlasterMine }),
          createCapApplication({ cap: 60, source: rocbouquetTemptation }),
        ]),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 60,
    },
    {
      name: "上限の無い種別（ダメージ上限アップ）なら null",
      args: [createEmptyStatusEffectState(), "battleAbility", "damageCapUp"],
      expected: null,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectMagnitudeCap(...args)).toBe(expected);
  });
});

describe("getStatusEffectMagnitude", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectMagnitude>;
    expected: ReturnType<typeof getStatusEffectMagnitude>;
  }>([
    {
      name: "ターン付き効果の効果量を返す",
      args: [
        applyAll([createApplication({ magnitude: 15 })]),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: 15,
    },
    {
      name: "ターン無し効果の効果量を返す",
      args: [
        applyAll([createApplication({ magnitude: 10, duration: permanent })]),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: 10,
    },
    {
      name: "同じ枠のターン無し 10% とターン付き 15% は合算して 25% になる",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            kind: "physicalAttackUp",
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "physicalAttackUp",
            magnitude: 15,
            duration: turns(3),
            source: timedSource1,
          }),
        ]),
        "supportAbility",
        "physicalAttackUp",
      ],
      expected: 25,
    },
    {
      name: "合計が 30% を超えても 30% で止まる",
      args: [
        applyAll([
          createApplication({ magnitude: 10, duration: permanent }),
          createApplication({ magnitude: 15, source: sourceA }),
          createApplication({ magnitude: 20, source: sourceB }),
        ]),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: 30,
    },
    {
      name: "上限引き上げ効果があれば、その上限まで反映される（物防ダウン 30% + 25% で上限 50%）",
      args: [
        applyAllCaps(
          [createCapApplication({ cap: 50 })],
          applyAll([
            createApplication({ kind: "physicalDefenseDown", magnitude: 30 }),
            createApplication({
              kind: "physicalDefenseDown",
              magnitude: 25,
              source: sourceA,
            }),
          ]),
        ),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 50,
    },
    {
      name: "上限引き上げ効果があっても、合計が上限未満ならそのまま",
      args: [
        applyAllCaps(
          [createCapApplication({ cap: 50 })],
          applyAll([
            createApplication({ kind: "physicalDefenseDown", magnitude: 40 }),
          ]),
        ),
        "battleAbility",
        "physicalDefenseDown",
      ],
      expected: 40,
    },
    {
      name: "かかっていなければ 0",
      args: [
        applyAll([createApplication()]),
        "supportAbility",
        "physicalAttackDown",
      ],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectMagnitude(...args)).toBe(expected);
  });
});

describe("listApplicableDamageUpKinds", () => {
  test.each<{
    name: string;
    args: Parameters<typeof listApplicableDamageUpKinds>;
    expected: ReturnType<typeof listApplicableDamageUpKinds>;
  }>([
    {
      name: "条件が無い剣攻撃には、全攻撃・全物理・剣が掛かる",
      args: ["sword", []],
      expected: ["damageUp", "physicalDamageUp", "swordDamageUp"],
    },
    {
      name: "弱点を突いたクリティカルの火攻撃には、全攻撃・全属性・火と、弱点時・クリティカル時が掛かる",
      args: ["fire", ["weakness", "critical"]],
      expected: [
        "criticalDamageUp",
        "damageUp",
        "elementalDamageUp",
        "fireDamageUp",
        "weaknessDamageUp",
      ],
    },
    {
      name: "ブレイク中の無属性攻撃には、全攻撃とブレイク中だけが掛かる",
      args: ["nonElemental", ["break"]],
      expected: ["breakDamageUp", "damageUp"],
    },
  ])("$name", ({ args, expected }) => {
    expect(listApplicableDamageUpKinds(...args)).toStrictEqual(expected);
  });
});

describe("getDamageUpMagnitude", () => {
  /** 剣士 ヴィオラEX「神器の継承者」: サポアビと装備性能による物理ダメージアップの上限が 50% */
  const heirOfDivineWeaponCaps: StatusEffectMagnitudeCapApplication[] = (
    [
      "axeDamageUp",
      "bookDamageUp",
      "bowDamageUp",
      "daggerDamageUp",
      "fanDamageUp",
      "spearDamageUp",
      "staffDamageUp",
      "swordDamageUp",
    ] as const
  ).map((kind) =>
    createCapApplication({
      slot: "supportAbility",
      kind,
      cap: 50,
      duration: permanent,
      source: violaHeirOfDivineWeapon,
    }),
  );

  test.each<{
    name: string;
    args: Parameters<typeof getDamageUpMagnitude>;
    expected: ReturnType<typeof getDamageUpMagnitude>;
  }>([
    {
      name: "深碧のアンサンブル 灯火の氷属性ダメージアップ 15% は氷攻撃に掛かる",
      args: [
        applyAll([
          createApplication({
            kind: "iceDamageUp",
            magnitude: 15,
            source: augusteDeepGreenEnsemble,
          }),
        ]),
        "battleAbility",
        "ice",
        [],
      ],
      expected: 15,
    },
    {
      name: "氷属性ダメージアップは火攻撃には掛からない",
      args: [
        applyAll([
          createApplication({
            kind: "iceDamageUp",
            magnitude: 15,
            source: augusteDeepGreenEnsemble,
          }),
        ]),
        "battleAbility",
        "fire",
        [],
      ],
      expected: 0,
    },
    {
      name: "烈火の如くの物理ダメージアップ 30% は剣攻撃に掛かる",
      args: [
        applyAll([
          createApplication({
            kind: "physicalDamageUp",
            magnitude: 30,
            duration: turns(3),
            source: violaLikeRagingFire,
          }),
        ]),
        "battleAbility",
        "sword",
        [],
      ],
      expected: 30,
    },
    {
      name: "物理ダメージアップは属性攻撃には掛からない",
      args: [
        applyAll([
          createApplication({
            kind: "physicalDamageUp",
            magnitude: 30,
            source: violaLikeRagingFire,
          }),
        ]),
        "battleAbility",
        "fire",
        [],
      ],
      expected: 0,
    },
    {
      name: "一途な想いのターン無しの属性ダメージアップ 20% は光攻撃に掛かる",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            kind: "elementalDamageUp",
            magnitude: 20,
            duration: permanent,
            source: rocbouquetSingleMindedLove,
          }),
        ]),
        "supportAbility",
        "light",
        [],
      ],
      expected: 20,
    },
    {
      name: "サルタレロの斧 20% と烈火の如くの物理 30% は、斧攻撃に対して合算してから 30% で止まる",
      args: [
        applyAll([
          createApplication({
            kind: "axeDamageUp",
            magnitude: 20,
            source: soniaSaltarello,
          }),
          createApplication({
            kind: "physicalDamageUp",
            magnitude: 30,
            duration: turns(3),
            source: violaLikeRagingFire,
          }),
        ]),
        "battleAbility",
        "axe",
        [],
      ],
      expected: 30,
    },
    {
      name: "サルタレロの斧 10% と盛りあげるの 15% は、斧攻撃に対して合算して 25% になる",
      args: [
        applyAll([
          createApplication({
            kind: "axeDamageUp",
            magnitude: 10,
            source: soniaSaltarello,
          }),
          createApplication({
            kind: "damageUp",
            magnitude: 15,
            duration: turns(3),
            source: molussoLiven,
          }),
        ]),
        "battleAbility",
        "axe",
        [],
      ],
      expected: 25,
    },
    {
      name: "赤心のオーラの物理・属性ダメージアップは、全物理と全属性の 2 つとして属性攻撃にも掛かる",
      args: [
        applyAll([
          createApplication({
            kind: "physicalDamageUp",
            magnitude: 30,
            source: crimsonCondemnerAura,
          }),
          createApplication({
            kind: "elementalDamageUp",
            magnitude: 30,
            source: crimsonCondemnerAura,
          }),
        ]),
        "battleAbility",
        "fire",
        [],
      ],
      expected: 30,
    },
    {
      name: "盛りあげるのダメージアップ 15% は無属性攻撃にも掛かる",
      args: [
        applyAll([
          createApplication({
            kind: "damageUp",
            magnitude: 15,
            duration: turns(3),
            source: molussoLiven,
          }),
        ]),
        "battleAbility",
        "nonElemental",
        [],
      ],
      expected: 15,
    },
    {
      name: "無属性攻撃には武器種別・全物理・全属性のダメージアップは掛からない",
      args: [
        applyAll([
          createApplication({
            kind: "swordDamageUp",
            magnitude: 10,
            source: sourceA,
          }),
          createApplication({
            kind: "physicalDamageUp",
            magnitude: 10,
            source: crimsonCondemnerAura,
          }),
          createApplication({
            kind: "elementalDamageUp",
            magnitude: 10,
            source: crimsonCondemnerAura,
          }),
        ]),
        "battleAbility",
        "nonElemental",
        [],
      ],
      expected: 0,
    },
    {
      name: "剣 15% + クリティカル時 15% は、剣攻撃でクリティカルなら 30%",
      args: [
        applyAll([
          createApplication({
            kind: "swordDamageUp",
            magnitude: 15,
            source: sourceA,
          }),
          createApplication({
            kind: "criticalDamageUp",
            magnitude: 15,
            source: sourceB,
          }),
        ]),
        "battleAbility",
        "sword",
        ["critical"],
      ],
      expected: 30,
    },
    {
      name: "剣 15% + クリティカル時 15% は、剣攻撃でクリティカルでなければ 15%",
      args: [
        applyAll([
          createApplication({
            kind: "swordDamageUp",
            magnitude: 15,
            source: sourceA,
          }),
          createApplication({
            kind: "criticalDamageUp",
            magnitude: 15,
            source: sourceB,
          }),
        ]),
        "battleAbility",
        "sword",
        [],
      ],
      expected: 15,
    },
    {
      name: "ブレイク中 20% + クリティカル時 20% + 弓 30% は、条件をすべて満たしても 30%",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            kind: "breakDamageUp",
            magnitude: 20,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "criticalDamageUp",
            magnitude: 20,
            duration: permanent,
            source: permanentSource2,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "bowDamageUp",
            magnitude: 30,
            duration: permanent,
            source: sourceA,
          }),
        ]),
        "supportAbility",
        "bow",
        ["break", "critical"],
      ],
      expected: 30,
    },
    {
      name: "光属性で計算して火弱点を突いた場合、光・全属性・弱点時を合算し、火は合算しない",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            kind: "lightDamageUp",
            magnitude: 5,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "elementalDamageUp",
            magnitude: 10,
            duration: permanent,
            source: rocbouquetSingleMindedLove,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "weaknessDamageUp",
            magnitude: 10,
            duration: permanent,
            source: finalEmpressSincerityPouch,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "fireDamageUp",
            magnitude: 10,
            duration: permanent,
            source: permanentSource2,
          }),
        ]),
        "supportAbility",
        "light",
        ["weakness"],
      ],
      expected: 25,
    },
    {
      name: "枠が違うダメージアップは合算しない",
      args: [
        applyAll([
          createApplication({
            kind: "swordDamageUp",
            magnitude: 20,
            source: sourceA,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "swordDamageUp",
            magnitude: 20,
            duration: permanent,
            source: sourceB,
          }),
        ]),
        "battleAbility",
        "sword",
        [],
      ],
      expected: 20,
    },
    {
      name: "神器の継承者があれば、サポアビ枠の剣攻撃への合算は 50% まで反映される",
      args: [
        applyAllCaps(
          heirOfDivineWeaponCaps,
          applyAll([
            createApplication({
              slot: "supportAbility",
              kind: "physicalDamageUp",
              magnitude: 30,
              duration: permanent,
              source: permanentSource1,
            }),
            createApplication({
              slot: "supportAbility",
              kind: "swordDamageUp",
              magnitude: 30,
              duration: permanent,
              source: permanentSource2,
            }),
          ]),
        ),
        "supportAbility",
        "sword",
        [],
      ],
      expected: 50,
    },
    {
      name: "神器の継承者があっても、属性攻撃の上限は 30% のまま",
      args: [
        applyAllCaps(
          heirOfDivineWeaponCaps,
          applyAll([
            createApplication({
              slot: "supportAbility",
              kind: "damageUp",
              magnitude: 40,
              duration: permanent,
              source: permanentSource1,
            }),
          ]),
        ),
        "supportAbility",
        "fire",
        [],
      ],
      expected: 30,
    },
    {
      name: "剣攻撃ダメージアップの上限引き上げは、槍攻撃には掛からない",
      args: [
        applyAllCaps(
          [
            createCapApplication({
              slot: "supportAbility",
              kind: "swordDamageUp",
              cap: 50,
              duration: permanent,
            }),
          ],
          applyAll([
            createApplication({
              slot: "supportAbility",
              kind: "damageUp",
              magnitude: 40,
              duration: permanent,
              source: permanentSource1,
            }),
          ]),
        ),
        "supportAbility",
        "spear",
        [],
      ],
      expected: 30,
    },
    {
      name: "無属性攻撃の上限は引き上げられない",
      args: [
        applyAllCaps(
          heirOfDivineWeaponCaps,
          applyAll([
            createApplication({
              slot: "supportAbility",
              kind: "damageUp",
              magnitude: 40,
              duration: permanent,
              source: permanentSource1,
            }),
          ]),
        ),
        "supportAbility",
        "nonElemental",
        [],
      ],
      expected: 30,
    },
    {
      name: "かかっていなければ 0",
      args: [createEmptyStatusEffectState(), "battleAbility", "sword", []],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getDamageUpMagnitude(...args)).toBe(expected);
  });
});

describe("listApplicableDamageCapUpKinds", () => {
  test.each<{
    name: string;
    args: Parameters<typeof listApplicableDamageCapUpKinds>;
    expected: ReturnType<typeof listApplicableDamageCapUpKinds>;
  }>([
    {
      name: "剣攻撃には、全攻撃・全物理・剣が掛かる",
      args: ["sword"],
      expected: ["damageCapUp", "physicalDamageCapUp", "swordDamageCapUp"],
    },
    {
      name: "氷攻撃には、全攻撃・全属性・氷が掛かる",
      args: ["ice"],
      expected: ["damageCapUp", "elementalDamageCapUp", "iceDamageCapUp"],
    },
    {
      name: "無属性攻撃には、全攻撃だけが掛かる",
      args: ["nonElemental"],
      expected: ["damageCapUp"],
    },
  ])("$name", ({ args, expected }) => {
    expect(listApplicableDamageCapUpKinds(...args)).toStrictEqual(expected);
  });
});

describe("getDamageCapUpMagnitude", () => {
  /** リュック「バオール」: ダメージ上限アップ（効果量 100000）（2 ターン） */
  const baor = createApplication({
    kind: "damageCapUp",
    magnitude: 100000,
    duration: turns(2),
    source: lueckBaor,
  });
  /** 七英雄ロックブーケ「パッションパフューム」: ダメージ上限アップ（効果量 100000）（3 ターン） */
  const passionPerfume = createApplication({
    slot: "ultimate",
    kind: "damageCapUp",
    magnitude: 100000,
    duration: turns(3),
    source: rocbouquetPassionPerfume,
  });

  test.each<{
    name: string;
    args: Parameters<typeof getDamageCapUpMagnitude>;
    expected: ReturnType<typeof getDamageCapUpMagnitude>;
  }>([
    {
      name: "バオールのダメージ上限アップ 100000 は剣攻撃に掛かる",
      args: [applyAll([baor]), "battleAbility", "sword"],
      expected: 100000,
    },
    {
      name: "全攻撃のダメージ上限アップは無属性攻撃にも掛かる",
      args: [applyAll([baor]), "battleAbility", "nonElemental"],
      expected: 100000,
    },
    {
      name: "違う付与元の 50000 と 100000 は上限なく合算して 150000 になる",
      args: [
        applyAll([
          createApplication({
            kind: "damageCapUp",
            magnitude: 50000,
            duration: turns(2),
            source: sourceA,
          }),
          createApplication({
            kind: "damageCapUp",
            magnitude: 100000,
            duration: turns(3),
            source: sourceB,
          }),
        ]),
        "battleAbility",
        "sword",
      ],
      expected: 150000,
    },
    {
      name: "代償の魔術 30000 とバオール 100000 は合算して 130000 になる",
      args: [
        applyAll([
          createApplication({
            kind: "damageCapUp",
            magnitude: 30000,
            duration: turns(2),
            source: osvaldPriceOfMagic,
          }),
          baor,
        ]),
        "battleAbility",
        "fire",
      ],
      expected: 130000,
    },
    {
      name: "大海の息吹の氷属性ダメージ上限アップは氷攻撃に掛かる",
      args: [applyAll(breathOfTheSeaApplications), "ultimate", "ice"],
      expected: 100000,
    },
    {
      name: "大海の息吹は火攻撃には掛からない",
      args: [applyAll(breathOfTheSeaApplications), "ultimate", "fire"],
      expected: 0,
    },
    {
      name: "大海の息吹は無属性攻撃には掛からない",
      args: [applyAll(breathOfTheSeaApplications), "ultimate", "nonElemental"],
      expected: 0,
    },
    {
      name: "同じ枠の全攻撃（パッションパフューム）と光属性（大海の息吹）は光攻撃に合算して掛かる",
      args: [
        applyAll([...breathOfTheSeaApplications, passionPerfume]),
        "ultimate",
        "light",
      ],
      expected: 200000,
    },
    {
      name: "全物理のダメージ上限アップは剣攻撃に掛かる",
      args: [
        applyAll([
          createApplication({
            kind: "physicalDamageCapUp",
            magnitude: 50000,
            source: sourceA,
          }),
        ]),
        "battleAbility",
        "sword",
      ],
      expected: 50000,
    },
    {
      name: "全物理のダメージ上限アップは属性攻撃には掛からない",
      args: [
        applyAll([
          createApplication({
            kind: "physicalDamageCapUp",
            magnitude: 50000,
            source: sourceA,
          }),
        ]),
        "battleAbility",
        "fire",
      ],
      expected: 0,
    },
    {
      name: "全属性のダメージ上限アップは無属性攻撃には掛からない",
      args: [
        applyAll([
          createApplication({
            kind: "elementalDamageCapUp",
            magnitude: 50000,
            source: sourceA,
          }),
        ]),
        "battleAbility",
        "nonElemental",
      ],
      expected: 0,
    },
    {
      name: "枠が違う効果は合算しない（バトアビのバオールと必殺技のパッションパフューム）",
      args: [applyAll([baor, passionPerfume]), "battleAbility", "sword"],
      expected: 100000,
    },
    {
      name: "ターン無しの一途な想いとアルベド族長の娘は合算して 200000 になる",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            kind: "damageCapUp",
            magnitude: 100000,
            duration: permanent,
            source: rocbouquetSingleMindedLove,
          }),
          createApplication({
            slot: "supportAbility",
            kind: "damageCapUp",
            magnitude: 100000,
            duration: permanent,
            source: lueckAlbedoChiefsDaughter,
          }),
        ]),
        "supportAbility",
        "sword",
      ],
      expected: 200000,
    },
    {
      name: "赤心のオーラの効果量 2 倍は、呼び出し側が確定した 200000 を渡す",
      args: [
        applyAll([
          createApplication({
            kind: "damageCapUp",
            magnitude: 200000,
            duration: turns(2),
            source: crimsonCondemnerAura,
          }),
        ]),
        "battleAbility",
        "staff",
      ],
      expected: 200000,
    },
    {
      name: "ダメージアップ系の種別はダメージ上限アップに含まれない",
      args: [
        applyAll([
          createApplication({
            kind: "damageUp",
            magnitude: 15,
            source: molussoLiven,
          }),
        ]),
        "battleAbility",
        "sword",
      ],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getDamageCapUpMagnitude(...args)).toBe(expected);
  });
});

describe("listApplicableResistanceKinds", () => {
  test.each<{
    name: string;
    args: Parameters<typeof listApplicableResistanceKinds>;
    expected: ReturnType<typeof listApplicableResistanceKinds>;
  }>([
    {
      name: "槍攻撃の耐性ダウンには、全物理・槍が掛かる",
      args: ["spear", "debuff"],
      expected: ["physicalResistanceDown", "spearResistanceDown"],
    },
    {
      name: "氷攻撃の耐性アップには、全属性・氷が掛かる",
      args: ["ice", "buff"],
      expected: ["elementalResistanceUp", "iceResistanceUp"],
    },
    {
      name: "無属性攻撃にはどの耐性も掛からない",
      args: ["nonElemental", "debuff"],
      expected: [],
    },
  ])("$name", ({ args, expected }) => {
    expect(listApplicableResistanceKinds(...args)).toStrictEqual(expected);
  });
});

describe("getResistanceMagnitude", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getResistanceMagnitude>;
    expected: ReturnType<typeof getResistanceMagnitude>;
  }>([
    {
      name: "満ちる叛意の槍耐性ダウン 15% は槍攻撃に掛かる",
      args: [
        applyAll(risingRebellionApplications),
        "supportAbility",
        "spear",
        "debuff",
      ],
      expected: 15,
    },
    {
      name: "満ちる叛意の槍・斧・闇耐性ダウンは剣攻撃には掛からない",
      args: [
        applyAll(risingRebellionApplications),
        "supportAbility",
        "sword",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "サポアビ枠の耐性ダウンはバトアビ枠には数えない",
      args: [
        applyAll(risingRebellionApplications),
        "battleAbility",
        "spear",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "略奪者の猛りの槍 15% と強奪の槍の物理 15% は、槍攻撃に対して合算される",
      args: [
        applyAll([plundererFuryApplication, plunderSpearApplication]),
        "battleAbility",
        "spear",
        "debuff",
      ],
      expected: 30,
    },
    {
      name: "強奪の槍の物理耐性ダウンは剣攻撃にも掛かるが、略奪者の猛りの槍耐性ダウンは掛からない",
      args: [
        applyAll([plundererFuryApplication, plunderSpearApplication]),
        "battleAbility",
        "sword",
        "debuff",
      ],
      expected: 15,
    },
    {
      name: "物理耐性ダウンは属性攻撃には掛からない",
      args: [
        applyAll([plunderSpearApplication]),
        "battleAbility",
        "fire",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "槍と物理の合算が 30% を超えると、槍攻撃に対して 30% で止まる",
      args: [
        applyAll([
          plundererFuryApplication,
          plunderSpearApplication,
          { ...plundererFuryApplication, source: sourceB },
        ]),
        "battleAbility",
        "spear",
        "debuff",
      ],
      expected: 30,
    },
    {
      name: "満ちる叛意の上限 60% があれば、バトアビ枠の槍攻撃に対する合算 45% がそのまま反映される",
      args: [
        applyAllCaps(
          risingRebellionCaps,
          applyAll([
            plundererFuryApplication,
            plunderSpearApplication,
            { ...plundererFuryApplication, source: sourceB },
          ]),
        ),
        "battleAbility",
        "spear",
        "debuff",
      ],
      expected: 45,
    },
    {
      name: "満ちる叛意の上限 60% は槍・斧・闇だけに掛かり、剣攻撃に対しては 30% で止まる",
      args: [
        applyAllCaps(
          risingRebellionCaps,
          applyAll([
            plunderSpearApplication,
            { ...plunderSpearApplication, source: sourceB },
            createApplication({
              kind: "swordResistanceDown",
              magnitude: 15,
              source: sourceA,
            }),
          ]),
        ),
        "battleAbility",
        "sword",
        "debuff",
      ],
      expected: 30,
    },
    {
      name: "魅惑の誘いの属性耐性ダウン 20% は火攻撃に掛かる",
      args: [
        applyAll([enticingInvitationApplication]),
        "supportAbility",
        "fire",
        "debuff",
      ],
      expected: 20,
    },
    {
      name: "魅惑の誘いの属性耐性ダウンは物理攻撃には掛からない",
      args: [
        applyAll([enticingInvitationApplication]),
        "supportAbility",
        "sword",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "属性耐性ダウンは無属性攻撃には掛からない",
      args: [
        applyAll([enticingInvitationApplication]),
        "supportAbility",
        "nonElemental",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "上限引き上げが無ければ、人魚の悲情の氷 30% と魅惑の誘いの属性 20% は氷攻撃に対して 30% で止まる",
      args: [
        applyAll([
          ...mermaidsSorrowApplications,
          enticingInvitationApplication,
        ]),
        "supportAbility",
        "ice",
        "debuff",
      ],
      expected: 30,
    },
    {
      name: "魅惑の誘いの上限 50% があれば、人魚の悲情の氷 30% と魅惑の誘いの属性 20% は氷攻撃に対して 50% になる",
      args: [
        applyAllCaps(
          enticingInvitationCaps,
          applyAll([
            ...mermaidsSorrowApplications,
            enticingInvitationApplication,
          ]),
        ),
        "supportAbility",
        "ice",
        "debuff",
      ],
      expected: 50,
    },
    {
      name: "調合：バオールの属性耐性アップ 30% は氷攻撃に掛かる",
      args: [
        applyAll([baorResistanceApplication]),
        "battleAbility",
        "ice",
        "buff",
      ],
      expected: 30,
    },
    {
      name: "耐性アップは耐性ダウンとして数えない",
      args: [
        applyAll([baorResistanceApplication]),
        "battleAbility",
        "ice",
        "debuff",
      ],
      expected: 0,
    },
    {
      name: "耐性ダウンは耐性アップとして数えない",
      args: [
        applyAll([enticingInvitationApplication]),
        "supportAbility",
        "ice",
        "buff",
      ],
      expected: 0,
    },
    {
      name: "ダメージアップ系の種別は耐性に含まれない",
      args: [
        applyAll([
          createApplication({
            kind: "spearDamageUp",
            magnitude: 15,
            source: sourceA,
          }),
        ]),
        "battleAbility",
        "spear",
        "buff",
      ],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getResistanceMagnitude(...args)).toBe(expected);
  });
});

describe("getStatusEffectRemainingTurns", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectRemainingTurns>;
    expected: ReturnType<typeof getStatusEffectRemainingTurns>;
  }>([
    {
      name: "ターン付き効果の残りターン数を返す",
      args: [
        applyAll([createApplication({ duration: turns(3) })]),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: 3,
    },
    {
      name: "ターン無し効果だけなら 0",
      args: [
        applyAll([createApplication({ duration: permanent })]),
        "battleAbility",
        "physicalAttackDown",
      ],
      expected: 0,
    },
    {
      name: "かかっていなければ 0",
      args: [
        applyAll([createApplication()]),
        "battleAbility",
        "physicalAttackUp",
      ],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectRemainingTurns(...args)).toBe(expected);
  });
});

describe("applyStatusEffect", () => {
  describe("ターン付き効果の重複", () => {
    test.each<{
      name: string;
      applications: StatusEffectApplication[];
      expected: StatusEffectPool[];
    }>([
      {
        name: "何もかかっていない対象に付与すると、そのまま新しいまとまりになる",
        applications: [createApplication()],
        expected: [
          createPool({
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "同じ付与元を重ねると効果量は増えず、ターンだけ合算される（アンチアタックⅡ ×2）",
        applications: [createApplication(), createApplication()],
        expected: [
          createPool({
            timedMagnitude: 20,
            remainingTurns: 4,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "違う付与元を重ねると効果量が加算される（アンチアタックⅡ 20% + 天鼠 15%）",
        applications: [
          createApplication(),
          createApplication({ magnitude: 15, source: therionTenso }),
        ],
        expected: [
          createPool({
            timedMagnitude: 35,
            remainingTurns: 4,
            timedSources: [violaAntiAttack2, therionTenso],
          }),
        ],
      },
      {
        name: "同名アビリティでも使用キャラが違えば付与元が違うので加算される（バックスタッブ）",
        applications: [
          createApplication({
            kind: "physicalDefenseDown",
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "thief:kuresu",
              abilityId: "backstab",
            },
          }),
          createApplication({
            kind: "physicalDefenseDown",
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "thief:dyuran",
              abilityId: "backstab",
            },
          }),
        ],
        expected: [
          createPool({
            kind: "physicalDefenseDown",
            timedMagnitude: 30,
            remainingTurns: 4,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "thief:kuresu",
                abilityId: "backstab",
              },
              {
                type: "activeAbility",
                characterId: "thief:dyuran",
                abilityId: "backstab",
              },
            ],
          }),
        ],
      },
      {
        name: "1 回の行動で同じ付与元が 4 回当たると、効果量そのままでターンが 4 倍になる（風切り羽）",
        applications: Array.from({ length: 4 }, () =>
          createApplication({
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "hunter:kuroe",
              abilityId: "kazakiribane",
            },
          }),
        ),
        expected: [
          createPool({
            timedMagnitude: 15,
            remainingTurns: 8,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "hunter:kuroe",
                abilityId: "kazakiribane",
              },
            ],
          }),
        ],
      },
      {
        name: "継続ターンは 9 で止まる",
        applications: Array.from({ length: 5 }, () => createApplication()),
        expected: [
          createPool({
            timedMagnitude: 20,
            remainingTurns: 9,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "効果量は上限を適用せず生の値で保持し、ターンは 9 に丸める",
        applications: [
          createApplication({ magnitude: 40, duration: turns(12) }),
        ],
        expected: [
          createPool({
            timedMagnitude: 40,
            remainingTurns: 9,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "同じ付与元でも重複可の指定があれば効果量が加算される（支援者 破滅の詩 ×2）",
        applications: [
          createApplication({
            magnitude: 10,
            source: {
              type: "activeAbility",
              characterId: "dancer:furanchesuka",
              abilityId: "hametsuNoUta",
            },
            stacksWithSameSource: true,
          }),
          createApplication({
            magnitude: 10,
            source: {
              type: "activeAbility",
              characterId: "dancer:furanchesuka",
              abilityId: "hametsuNoUta",
            },
            stacksWithSameSource: true,
          }),
        ],
        expected: [
          createPool({
            timedMagnitude: 20,
            remainingTurns: 4,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "dancer:furanchesuka",
                abilityId: "hametsuNoUta",
              },
            ],
          }),
        ],
      },
      {
        name: "ブースト MAX 時重複可のアビリティは、通常時と MAX 時を区別で分けて加算する（雷獣の詩）",
        applications: [
          createApplication({
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "dancer:titi",
              abilityId: "raijuNoUta",
            },
          }),
          createApplication({
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "dancer:titi",
              abilityId: "raijuNoUta",
              variant: "boostMax",
            },
          }),
          createApplication({
            magnitude: 15,
            source: {
              type: "activeAbility",
              characterId: "dancer:titi",
              abilityId: "raijuNoUta",
              variant: "boostMax",
            },
          }),
        ],
        expected: [
          createPool({
            timedMagnitude: 30,
            remainingTurns: 6,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "dancer:titi",
                abilityId: "raijuNoUta",
              },
              {
                type: "activeAbility",
                characterId: "dancer:titi",
                abilityId: "raijuNoUta",
                variant: "boostMax",
              },
            ],
          }),
        ],
      },
      {
        name: "枠が違えば効果量もターンも別々に管理される（達人の鼓舞Ⅲ + 必殺技 撫でし子の舞）",
        applications: [
          createApplication({
            kind: "physicalAttackUp",
            source: {
              type: "activeAbility",
              characterId: "dancer:rinetto",
              abilityId: "tatsujinNoKobu3",
            },
          }),
          createApplication({
            slot: "ultimate",
            kind: "physicalAttackUp",
            duration: turns(3),
            source: {
              type: "activeAbility",
              characterId: "dancer:purimuroze",
              abilityId: "ultimate",
            },
          }),
        ],
        expected: [
          createPool({
            kind: "physicalAttackUp",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "dancer:rinetto",
                abilityId: "tatsujinNoKobu3",
              },
            ],
          }),
          createPool({
            slot: "ultimate",
            kind: "physicalAttackUp",
            timedMagnitude: 20,
            remainingTurns: 3,
            timedSources: [
              {
                type: "activeAbility",
                characterId: "dancer:purimuroze",
                abilityId: "ultimate",
              },
            ],
          }),
        ],
      },
      {
        name: "同じ枠でも種別が違えば別々に管理される（物攻ダウンと属攻ダウン）",
        applications: [
          createApplication({ kind: "physicalAttackDown" }),
          createApplication({ kind: "elementalAttackDown" }),
        ],
        expected: [
          createPool({
            kind: "physicalAttackDown",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [violaAntiAttack2],
          }),
          createPool({
            kind: "elementalAttackDown",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "同じパラメーターのアップとダウンは別の種別として管理される（相殺しない）",
        applications: [
          createApplication({ kind: "physicalAttackUp", source: sourceA }),
          createApplication({ kind: "physicalAttackDown", source: sourceB }),
        ],
        expected: [
          createPool({
            kind: "physicalAttackUp",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [sourceA],
          }),
          createPool({
            kind: "physicalAttackDown",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [sourceB],
          }),
        ],
      },
      {
        name: "ダメージ上限アップは上限なく合算される（50000・2 ターン + 100000・3 ターン → 150000・5 ターン）",
        applications: [
          createApplication({
            kind: "damageCapUp",
            magnitude: 50000,
            duration: turns(2),
            source: sourceA,
          }),
          createApplication({
            kind: "damageCapUp",
            magnitude: 100000,
            duration: turns(3),
            source: sourceB,
          }),
        ],
        expected: [
          createPool({
            kind: "damageCapUp",
            timedMagnitude: 150000,
            remainingTurns: 5,
            timedSources: [sourceA, sourceB],
          }),
        ],
      },
      {
        name: "ダメージ上限アップも同じ付与元を重ねると効果量は増えない（バオール ×2）",
        applications: [
          createApplication({
            kind: "damageCapUp",
            magnitude: 100000,
            duration: turns(2),
            source: lueckBaor,
          }),
          createApplication({
            kind: "damageCapUp",
            magnitude: 100000,
            duration: turns(2),
            source: lueckBaor,
          }),
        ],
        expected: [
          createPool({
            kind: "damageCapUp",
            timedMagnitude: 100000,
            remainingTurns: 4,
            timedSources: [lueckBaor],
          }),
        ],
      },
      {
        name: "大海の息吹は氷・風・光の 3 つのまとまりになる",
        applications: breathOfTheSeaApplications,
        expected: (
          ["iceDamageCapUp", "windDamageCapUp", "lightDamageCapUp"] as const
        ).map((kind) =>
          createPool({
            slot: "ultimate",
            kind,
            timedMagnitude: 100000,
            remainingTurns: 6,
            timedSources: [linyuBreathOfTheSea],
          }),
        ),
      },
    ])("$name", ({ applications, expected }) => {
      expect(applyAll(applications)).toStrictEqual(createState(expected));
    });
  });

  describe("ターン無し効果", () => {
    test.each<{
      name: string;
      applications: StatusEffectApplication[];
      expected: StatusEffectPool[];
    }>([
      {
        name: "ターン無し効果を付与すると、残りターン 0 のまとまりになる",
        applications: [
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ],
        expected: [
          createPool({
            permanentSources: [{ source: permanentSource1, magnitude: 10 }],
          }),
        ],
      },
      {
        name: "同じ付与元のターン無し効果を再付与すると差し替えになる",
        applications: [
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            magnitude: 15,
            duration: permanent,
            source: permanentSource1,
          }),
        ],
        expected: [
          createPool({
            permanentSources: [{ source: permanentSource1, magnitude: 15 }],
          }),
        ],
      },
      {
        name: "違う付与元のターン無し効果は並んで保持される",
        applications: [
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            magnitude: 5,
            duration: permanent,
            source: permanentSource2,
          }),
        ],
        expected: [
          createPool({
            permanentSources: [
              { source: permanentSource1, magnitude: 10 },
              { source: permanentSource2, magnitude: 5 },
            ],
          }),
        ],
      },
      {
        name: "ターン無しとターン付きは同じまとまりに入り、ターンはターン付きの分だけになる",
        applications: [
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            magnitude: 15,
            duration: turns(3),
            source: timedSource1,
          }),
        ],
        expected: [
          createPool({
            permanentSources: [{ source: permanentSource1, magnitude: 10 }],
            timedMagnitude: 15,
            remainingTurns: 3,
            timedSources: [timedSource1],
          }),
        ],
      },
      {
        name: "ターン付きの後にターン無しを付与しても、残りターンは変わらない",
        applications: [
          createApplication({
            magnitude: 15,
            duration: turns(3),
            source: timedSource1,
          }),
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ],
        expected: [
          createPool({
            permanentSources: [{ source: permanentSource1, magnitude: 10 }],
            timedMagnitude: 15,
            remainingTurns: 3,
            timedSources: [timedSource1],
          }),
        ],
      },
    ])("$name", ({ applications, expected }) => {
      expect(applyAll(applications)).toStrictEqual(createState(expected));
    });
  });

  describe("不変性", () => {
    it("元の状態を変更しない", () => {
      const before = applyAll([createApplication()]);
      const snapshot = structuredClone(before);
      applyStatusEffect(before, createApplication({ source: sourceA }));
      applyStatusEffect(
        before,
        createApplication({ duration: permanent, source: permanentSource1 }),
      );
      expect(before).toStrictEqual(snapshot);
    });
  });

  describe("不正な入力", () => {
    test.each<{
      name: string;
      application: StatusEffectApplication;
      expected: string;
    }>([
      {
        name: "効果量が 0 なら例外",
        application: createApplication({ magnitude: 0 }),
        expected: "効果量は正の数である必要があります",
      },
      {
        name: "効果量が負なら例外",
        application: createApplication({ magnitude: -10 }),
        expected: "効果量は正の数である必要があります",
      },
      {
        name: "ターン無し効果でも効果量が 0 なら例外",
        application: createApplication({ magnitude: 0, duration: permanent }),
        expected: "効果量は正の数である必要があります",
      },
      {
        name: "継続ターンが 0 なら例外",
        application: createApplication({ duration: turns(0) }),
        expected: "継続ターンは 1 以上の整数である必要があります",
      },
      {
        name: "継続ターンが整数でなければ例外",
        application: createApplication({ duration: turns(1.5) }),
        expected: "継続ターンは 1 以上の整数である必要があります",
      },
    ])("$name", ({ application, expected }) => {
      expect(() =>
        applyStatusEffect(createEmptyStatusEffectState(), application),
      ).toThrow(expected);
    });
  });
});

describe("applyStatusEffectMagnitudeCap", () => {
  test.each<{
    name: string;
    applications: StatusEffectMagnitudeCapApplication[];
    expected: StatusEffectMagnitudeCap[];
  }>([
    {
      name: "ターン付きの上限引き上げ効果を付与する（調合：ブラスターマイン 上限 50%・3 ターン）",
      applications: [createCapApplication()],
      expected: [createCap()],
    },
    {
      name: "ターン無しの上限引き上げ効果を付与する（アルベド族長の娘 上限 60%）",
      applications: [
        createCapApplication({
          slot: "supportAbility",
          kind: "physicalAttackUp",
          cap: 60,
          duration: permanent,
          source: lueckAlbedoChiefsDaughter,
        }),
      ],
      expected: [
        createCap({
          slot: "supportAbility",
          kind: "physicalAttackUp",
          cap: 60,
          remainingTurns: null,
          source: lueckAlbedoChiefsDaughter,
        }),
      ],
    },
    {
      name: "同じ付与元を重ねると残りターンが合算される",
      applications: [createCapApplication(), createCapApplication()],
      expected: [createCap({ remainingTurns: 6 })],
    },
    {
      name: "同じ付与元の残りターンは 9 で止まる",
      applications: Array.from({ length: 4 }, () => createCapApplication()),
      expected: [createCap({ remainingTurns: 9 })],
    },
    {
      name: "同じ付与元を違う上限値で重ねると上限値が差し替わる",
      applications: [
        createCapApplication({ cap: 50 }),
        createCapApplication({ cap: 60 }),
      ],
      expected: [createCap({ cap: 60, remainingTurns: 6 })],
    },
    {
      name: "違う付与元は別の効果として並存する",
      applications: [
        createCapApplication({ source: lueckBlasterMine }),
        createCapApplication({
          duration: turns(2),
          source: rocbouquetTemptation,
        }),
      ],
      expected: [
        createCap({ source: lueckBlasterMine }),
        createCap({ remainingTurns: 2, source: rocbouquetTemptation }),
      ],
    },
    {
      name: "種別が違えば同じ付与元でも別の効果になる（物防・属防ダウンの上限を 1 件ずつ付与）",
      applications: [
        createCapApplication({ kind: "physicalDefenseDown" }),
        createCapApplication({ kind: "elementalDefenseDown" }),
      ],
      expected: [
        createCap({ kind: "physicalDefenseDown" }),
        createCap({ kind: "elementalDefenseDown" }),
      ],
    },
    {
      name: "満ちる叛意の上限 60% は、槍・斧・闇 × バトアビ・サポアビの 6 件として付与される",
      applications: risingRebellionCaps,
      expected: (["battleAbility", "supportAbility"] as const).flatMap((slot) =>
        (
          [
            "spearResistanceDown",
            "axeResistanceDown",
            "darkResistanceDown",
          ] as const
        ).map((kind) =>
          createCap({
            slot,
            kind,
            cap: 60,
            remainingTurns: null,
            source: frenziedFoolRisingRebellion,
          }),
        ),
      ),
    },
  ])("$name", ({ applications, expected }) => {
    expect(applyAllCaps(applications)).toStrictEqual(createState([], expected));
  });

  it("まとまりには影響しない", () => {
    const before = applyAll([createApplication()]);
    const after = applyStatusEffectMagnitudeCap(before, createCapApplication());
    expect(after.pools).toStrictEqual(before.pools);
  });

  it("元の状態を変更しない", () => {
    const before = applyAllCaps([createCapApplication()]);
    const snapshot = structuredClone(before);
    applyStatusEffectMagnitudeCap(before, createCapApplication({ cap: 60 }));
    expect(before).toStrictEqual(snapshot);
  });

  describe("不正な入力", () => {
    test.each<{
      name: string;
      application: StatusEffectMagnitudeCapApplication;
      expected: string;
    }>([
      {
        name: "上限が 0 なら例外",
        application: createCapApplication({ cap: 0 }),
        expected: "上限は正の数である必要があります",
      },
      {
        name: "継続ターンが 0 なら例外",
        application: createCapApplication({ duration: turns(0) }),
        expected: "継続ターンは 1 以上の整数である必要があります",
      },
      {
        name: "物理ダメージアップ（全物理）を指定すると例外",
        application: createCapApplication({ kind: "physicalDamageUp" }),
        expected:
          "ダメージアップ系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=physicalDamageUp",
      },
      {
        name: "弱点時ダメージアップを指定すると例外",
        application: createCapApplication({ kind: "weaknessDamageUp" }),
        expected:
          "ダメージアップ系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=weaknessDamageUp",
      },
      {
        name: "物理耐性ダウン（全物理）を指定すると例外",
        application: createCapApplication({ kind: "physicalResistanceDown" }),
        expected:
          "耐性系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=physicalResistanceDown",
      },
      {
        name: "属性耐性アップ（全属性）を指定すると例外",
        application: createCapApplication({ kind: "elementalResistanceUp" }),
        expected:
          "耐性系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=elementalResistanceUp",
      },
      {
        name: "上限の無いダメージ上限アップを指定すると例外",
        application: createCapApplication({ kind: "damageCapUp" }),
        expected:
          "上限の無い種別には上限引き上げ効果を指定できません: kind=damageCapUp",
      },
      {
        name: "上限の無い剣攻撃ダメージ上限アップを指定すると例外",
        application: createCapApplication({ kind: "swordDamageCapUp" }),
        expected:
          "上限の無い種別には上限引き上げ効果を指定できません: kind=swordDamageCapUp",
      },
    ])("$name", ({ application, expected }) => {
      expect(() =>
        applyStatusEffectMagnitudeCap(
          createEmptyStatusEffectState(),
          application,
        ),
      ).toThrow(expected);
    });
  });
});

describe("removePermanentStatusEffect", () => {
  test.each<{
    name: string;
    args: Parameters<typeof removePermanentStatusEffect>;
    expected: ReturnType<typeof removePermanentStatusEffect>;
  }>([
    {
      name: "指定した付与元のターン無し効果を取り除き、他のターン無し効果は残す",
      args: [
        applyAll([
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            magnitude: 5,
            duration: permanent,
            source: permanentSource2,
          }),
        ]),
        permanentSource1,
      ],
      expected: createState([
        createPool({
          permanentSources: [{ source: permanentSource2, magnitude: 5 }],
        }),
      ]),
    },
    {
      name: "ターン付き効果が残っていればまとまりは残る",
      args: [
        applyAll([
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({ source: timedSource1 }),
        ]),
        permanentSource1,
      ],
      expected: createState([
        createPool({
          timedMagnitude: 20,
          remainingTurns: 2,
          timedSources: [timedSource1],
        }),
      ]),
    },
    {
      name: "何も残らないまとまりは取り除かれる",
      args: [
        applyAll([
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ]),
        permanentSource1,
      ],
      expected: createEmptyStatusEffectState(),
    },
    {
      name: "複数の種別にまたがる同じ付与元をまとめて取り除く",
      args: [
        applyAll([
          createApplication({
            kind: "physicalAttackUp",
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            kind: "elementalAttackUp",
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ]),
        permanentSource1,
      ],
      expected: createEmptyStatusEffectState(),
    },
    {
      name: "ターン無しの上限引き上げ効果も取り除く（アルベド族長の娘の条件が外れた）",
      args: [
        applyAllCaps([
          createCapApplication({
            slot: "supportAbility",
            kind: "physicalAttackUp",
            cap: 60,
            duration: permanent,
            source: lueckAlbedoChiefsDaughter,
          }),
          createCapApplication({
            slot: "supportAbility",
            kind: "elementalAttackUp",
            cap: 60,
            duration: permanent,
            source: lueckAlbedoChiefsDaughter,
          }),
          createCapApplication(),
        ]),
        lueckAlbedoChiefsDaughter,
      ],
      expected: createState([], [createCap()]),
    },
    {
      name: "同じ付与元でもターン付きの上限引き上げ効果は取り除かない",
      args: [applyAllCaps([createCapApplication()]), lueckBlasterMine],
      expected: createState([], [createCap()]),
    },
    {
      name: "該当する付与元が無ければ変化しない",
      args: [
        applyAll([createApplication({ source: timedSource1 })]),
        permanentSource1,
      ],
      expected: createState([
        createPool({
          timedMagnitude: 20,
          remainingTurns: 2,
          timedSources: [timedSource1],
        }),
      ]),
    },
  ])("$name", ({ args, expected }) => {
    expect(removePermanentStatusEffect(...args)).toStrictEqual(expected);
  });

  it("元の状態を変更しない", () => {
    const before = applyAll([
      createApplication({ duration: permanent, source: permanentSource1 }),
    ]);
    const snapshot = structuredClone(before);
    removePermanentStatusEffect(before, permanentSource1);
    expect(before).toStrictEqual(snapshot);
  });
});

describe("elapseStatusEffectTurn", () => {
  test.each<{
    name: string;
    args: Parameters<typeof elapseStatusEffectTurn>;
    expected: ReturnType<typeof elapseStatusEffectTurn>;
  }>([
    {
      name: "各まとまりの残りターンが 1 減る",
      args: [
        applyAll([
          createApplication({ duration: turns(3) }),
          createApplication({ slot: "ultimate", source: sourceA }),
        ]),
      ],
      expected: createState([
        createPool({
          timedMagnitude: 20,
          remainingTurns: 2,
          timedSources: [violaAntiAttack2],
        }),
        createPool({
          slot: "ultimate",
          timedMagnitude: 20,
          remainingTurns: 1,
          timedSources: [sourceA],
        }),
      ]),
    },
    {
      name: "残りターンが 1 で他に何も無いまとまりは取り除かれる",
      args: [applyAll([createApplication({ duration: turns(1) })])],
      expected: createEmptyStatusEffectState(),
    },
    {
      name: "残りターンが 1 でターン無し効果があれば、ターン付き効果だけ消えてまとまりは残る",
      args: [
        applyAll([
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({ duration: turns(1), source: timedSource1 }),
        ]),
      ],
      expected: createState([
        createPool({
          permanentSources: [{ source: permanentSource1, magnitude: 10 }],
        }),
      ]),
    },
    {
      name: "ターン無し効果だけのまとまりは変化しない",
      args: [
        applyAll([
          createApplication({
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ]),
      ],
      expected: createState([
        createPool({
          permanentSources: [{ source: permanentSource1, magnitude: 10 }],
        }),
      ]),
    },
    {
      name: "ターン付きの上限引き上げ効果は残りターンが 1 減り、0 になれば取り除かれる",
      args: [
        applyAllCaps([
          createCapApplication({ duration: turns(3) }),
          createCapApplication({
            duration: turns(1),
            source: rocbouquetTemptation,
          }),
        ]),
      ],
      expected: createState([], [createCap({ remainingTurns: 2 })]),
    },
    {
      name: "ターン無しの上限引き上げ効果は変化しない",
      args: [
        applyAllCaps([
          createCapApplication({
            duration: permanent,
            source: lueckAlbedoChiefsDaughter,
          }),
        ]),
      ],
      expected: createState(
        [],
        [
          createCap({
            remainingTurns: null,
            source: lueckAlbedoChiefsDaughter,
          }),
        ],
      ),
    },
    {
      name: "空の状態は空のまま",
      args: [createEmptyStatusEffectState()],
      expected: createEmptyStatusEffectState(),
    },
  ])("$name", ({ args, expected }) => {
    expect(elapseStatusEffectTurn(...args)).toStrictEqual(expected);
  });

  it("元の状態を変更しない", () => {
    const before = applyAllCaps(
      [createCapApplication()],
      applyAll([createApplication()]),
    );
    const snapshot = structuredClone(before);
    elapseStatusEffectTurn(before);
    expect(before).toStrictEqual(snapshot);
  });
});

describe("ターンをまたいだシナリオ", () => {
  const readBattleAbilityAttackUp = (state: StatusEffectState) => ({
    magnitude: getStatusEffectMagnitude(
      state,
      "battleAbility",
      "physicalAttackUp",
    ),
    remainingTurns: getStatusEffectRemainingTurns(
      state,
      "battleAbility",
      "physicalAttackUp",
    ),
  });

  it("1 ターン目に 10%（2 ターン）、2 ターン目に別技で 20%（2 ターン）を付与すると、2〜4 ターン目は 30% になる", () => {
    // 1 ターン目
    let state = applyStatusEffect(
      createEmptyStatusEffectState(),
      createApplication({
        kind: "physicalAttackUp",
        magnitude: 10,
        source: sourceA,
      }),
    );
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 10,
      remainingTurns: 2,
    });
    state = elapseStatusEffectTurn(state);

    // 2 ターン目: 残り 1 ターンに 2 ターン分が足されて 3 ターンになる
    state = applyStatusEffect(
      state,
      createApplication({
        kind: "physicalAttackUp",
        magnitude: 20,
        source: sourceB,
      }),
    );
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 3,
    });
    state = elapseStatusEffectTurn(state);

    // 3 ターン目
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 2,
    });
    state = elapseStatusEffectTurn(state);

    // 4 ターン目: 効果量は切れる直前まで 30% のまま
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 1,
    });
    state = elapseStatusEffectTurn(state);

    // 5 ターン目: 消えている
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 0,
      remainingTurns: 0,
    });
  });

  it("切れる前にどちらの技で延長しても 30% が維持される", () => {
    let state = applyAll([
      createApplication({
        kind: "physicalAttackUp",
        magnitude: 10,
        source: sourceA,
      }),
      createApplication({
        kind: "physicalAttackUp",
        magnitude: 20,
        source: sourceB,
      }),
    ]);
    state = elapseStatusEffectTurn(state);
    state = elapseStatusEffectTurn(state);
    state = elapseStatusEffectTurn(state);
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 1,
    });

    state = applyStatusEffect(
      state,
      createApplication({
        kind: "physicalAttackUp",
        magnitude: 10,
        source: sourceA,
      }),
    );
    expect(readBattleAbilityAttackUp(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 3,
    });
  });

  it("サポアビ枠のターン無し 10% とターン付き 15% は合わせて 25% になり、ターン付きが切れると 10% に戻る", () => {
    const read = (state: StatusEffectState) =>
      getStatusEffectMagnitude(state, "supportAbility", "physicalAttackUp");

    let state = applyAll([
      createApplication({
        slot: "supportAbility",
        kind: "physicalAttackUp",
        magnitude: 10,
        duration: permanent,
        source: permanentSource1,
      }),
      createApplication({
        slot: "supportAbility",
        kind: "physicalAttackUp",
        magnitude: 15,
        duration: turns(2),
        source: timedSource1,
      }),
    ]);
    expect(read(state)).toBe(25);

    state = elapseStatusEffectTurn(state);
    expect(read(state)).toBe(25);

    state = elapseStatusEffectTurn(state);
    expect(read(state)).toBe(10);

    state = removePermanentStatusEffect(state, permanentSource1);
    expect(read(state)).toBe(0);
    expect(state).toStrictEqual(createEmptyStatusEffectState());
  });

  it("上限引き上げ効果が付いた瞬間に、それまで 30% を超えていた分も反映され、切れると 30% に戻る", () => {
    const read = (state: StatusEffectState) =>
      getStatusEffectMagnitude(state, "battleAbility", "physicalDefenseDown");

    // 物防ダウン 30% + 25% を先に付与（生の値は 55%、上限 30% で止まる）
    let state = applyAll([
      createApplication({
        kind: "physicalDefenseDown",
        magnitude: 30,
        duration: turns(5),
      }),
      createApplication({
        kind: "physicalDefenseDown",
        magnitude: 25,
        duration: turns(5),
        source: sourceA,
      }),
    ]);
    expect(read(state)).toBe(30);

    // 調合：ブラスターマイン（上限 50%、3 ターン）
    state = applyStatusEffectMagnitudeCap(state, createCapApplication());
    expect(read(state)).toBe(50);

    state = elapseStatusEffectTurn(state);
    state = elapseStatusEffectTurn(state);
    expect(read(state)).toBe(50);

    // 3 ターン目の終わりで上限引き上げ効果が切れる
    state = elapseStatusEffectTurn(state);
    expect(read(state)).toBe(30);
    expect(
      getStatusEffectMagnitudeCap(
        state,
        "battleAbility",
        "physicalDefenseDown",
      ),
    ).toBe(30);
  });
});

describe("ダメージアップのターンをまたいだシナリオ", () => {
  it("盛りあげる 15%（3 ターン）と深碧のアンサンブル 灯火 15%（2 ターン）は種別ごとにターンを管理し、氷攻撃は 1〜2 ターン目 30%、3 ターン目 15%、4 ターン目 0% になる", () => {
    const readIce = (current: StatusEffectState): number =>
      getDamageUpMagnitude(current, "battleAbility", "ice", []);

    // 1 ターン目
    let state = applyAll([
      createApplication({
        kind: "damageUp",
        magnitude: 15,
        duration: turns(3),
        source: molussoLiven,
      }),
      createApplication({
        kind: "iceDamageUp",
        magnitude: 15,
        duration: turns(2),
        source: augusteDeepGreenEnsemble,
      }),
    ]);
    expect(readIce(state)).toBe(30);
    state = elapseStatusEffectTurn(state);

    // 2 ターン目
    expect(readIce(state)).toBe(30);
    state = elapseStatusEffectTurn(state);

    // 3 ターン目: 氷属性ダメージアップが切れ、全攻撃のダメージアップだけが残る
    expect(readIce(state)).toBe(15);
    state = elapseStatusEffectTurn(state);

    // 4 ターン目
    expect(readIce(state)).toBe(0);
  });
});

describe("ダメージ上限アップのターンをまたいだシナリオ", () => {
  it("代償の魔術 30000（2 ターン）の 2 ターン目にバオール 100000（2 ターン）を重ねると、1 ターン目 30000、2〜4 ターン目 130000、5 ターン目 0 になる", () => {
    const readSword = (current: StatusEffectState): number =>
      getDamageCapUpMagnitude(current, "battleAbility", "sword");

    // 1 ターン目
    let state = applyAll([
      createApplication({
        kind: "damageCapUp",
        magnitude: 30000,
        duration: turns(2),
        source: osvaldPriceOfMagic,
      }),
    ]);
    expect(readSword(state)).toBe(30000);
    state = elapseStatusEffectTurn(state);

    // 2 ターン目: 残り 1 ターンに 2 ターンが合算され、残り 3 ターンになる
    state = applyAll(
      [
        createApplication({
          kind: "damageCapUp",
          magnitude: 100000,
          duration: turns(2),
          source: lueckBaor,
        }),
      ],
      state,
    );
    expect(readSword(state)).toBe(130000);
    state = elapseStatusEffectTurn(state);

    // 3 ターン目: 代償の魔術のターンは過ぎているが、まとまりが切れるまで効果量は下がらない
    expect(readSword(state)).toBe(130000);
    state = elapseStatusEffectTurn(state);

    // 4 ターン目
    expect(readSword(state)).toBe(130000);
    state = elapseStatusEffectTurn(state);

    // 5 ターン目
    expect(readSword(state)).toBe(0);
  });
});

describe("耐性ダウンのターンをまたいだシナリオ", () => {
  it("略奪者の猛り（槍・2 ターン）の 2 ターン目に強奪の槍（物理・2 ターン）を重ねると、種別ごとにターンが管理され、槍攻撃に対して 1 ターン目 15%、2 ターン目 30%、3 ターン目 15%、4 ターン目 0% になる", () => {
    const readSpear = (current: StatusEffectState): number =>
      getResistanceMagnitude(current, "battleAbility", "spear", "debuff");

    // 1 ターン目
    let state = applyAll([plundererFuryApplication]);
    expect(readSpear(state)).toBe(15);
    state = elapseStatusEffectTurn(state);

    // 2 ターン目: 物理耐性ダウンは槍耐性ダウンとは別のまとまりなので、ターンは合算されない
    state = applyAll([plunderSpearApplication], state);
    expect(readSpear(state)).toBe(30);
    expect(
      getStatusEffectRemainingTurns(
        state,
        "battleAbility",
        "spearResistanceDown",
      ),
    ).toBe(1);
    expect(
      getStatusEffectRemainingTurns(
        state,
        "battleAbility",
        "physicalResistanceDown",
      ),
    ).toBe(2);
    state = elapseStatusEffectTurn(state);

    // 3 ターン目: 槍耐性ダウンが切れ、物理耐性ダウンだけが残る
    expect(readSpear(state)).toBe(15);
    state = elapseStatusEffectTurn(state);

    // 4 ターン目
    expect(readSpear(state)).toBe(0);
  });
});

describe("耐性ダウンの上限引き上げのターンをまたいだシナリオ", () => {
  it("人魚の悲情の上限 50%（3 ターン）は 3 ターン目まで有効で、4 ターン目にはサポアビ枠の氷攻撃に対する上限が 30% に戻る", () => {
    const readIce = (current: StatusEffectState): number =>
      getResistanceMagnitude(current, "supportAbility", "ice", "debuff");

    // 1 ターン目: 人魚の悲情の氷 30% + ターン無しの氷 30% + 魅惑の誘いの属性 20% = 80% が上限 50% で止まる
    let state = applyAllCaps(
      mermaidsSorrowCaps,
      applyAll([
        ...mermaidsSorrowApplications,
        createApplication({
          slot: "supportAbility",
          kind: "iceResistanceDown",
          magnitude: 30,
          duration: permanent,
          source: sourceA,
        }),
        enticingInvitationApplication,
      ]),
    );
    expect(readIce(state)).toBe(50);
    state = elapseStatusEffectTurn(state);

    // 2 ターン目
    expect(readIce(state)).toBe(50);
    state = elapseStatusEffectTurn(state);

    // 3 ターン目
    expect(readIce(state)).toBe(50);
    state = elapseStatusEffectTurn(state);

    // 4 ターン目: 人魚の悲情の耐性ダウンと上限引き上げが切れ、残りの 50% が既定の上限 30% で止まる
    expect(readIce(state)).toBe(30);
  });
});
