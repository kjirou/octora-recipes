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
  getDamageUpMagnitude,
  getStatusEffectMagnitude,
  getStatusEffectMagnitudeCap,
  getStatusEffectRemainingTurns,
  isSameStatusEffectSource,
  listApplicableDamageUpKinds,
  removePermanentStatusEffect,
} from "./statusEffect";

const permanent: StatusEffectDuration = { type: "permanent" };
const turns = (turns: number): StatusEffectDuration => ({
  type: "turns",
  turns,
});

const violaAntiAttack2: StatusEffectSource = {
  characterId: "viola",
  abilityId: "antiAttack2",
};
const therionTenso: StatusEffectSource = {
  characterId: "therion",
  abilityId: "tenso",
};
const sourceA: StatusEffectSource = { characterId: "a", abilityId: "a" };
const sourceB: StatusEffectSource = { characterId: "b", abilityId: "b" };
const permanentSource1: StatusEffectSource = {
  characterId: "p",
  abilityId: "p1",
};
const permanentSource2: StatusEffectSource = {
  characterId: "p",
  abilityId: "p2",
};
const timedSource1: StatusEffectSource = { characterId: "t", abilityId: "t1" };
const lueckAlbedoChiefsDaughter: StatusEffectSource = {
  characterId: "lueck",
  abilityId: "albedoChiefsDaughter",
};
const lueckBlasterMine: StatusEffectSource = {
  characterId: "lueck",
  abilityId: "blasterMine",
};
const rocbouquetTemptation: StatusEffectSource = {
  characterId: "rocbouquet",
  abilityId: "temptationEx",
};
const augusteDeepGreenEnsemble: StatusEffectSource = {
  characterId: "augusteEx",
  abilityId: "deepGreenEnsembleTorch",
};
const violaLikeRagingFire: StatusEffectSource = {
  characterId: "violaEx",
  abilityId: "likeRagingFire",
};
const violaHeirOfDivineWeapon: StatusEffectSource = {
  characterId: "violaEx",
  abilityId: "heirOfDivineWeapon",
};
const soniaSaltarello: StatusEffectSource = {
  characterId: "soniaEx",
  abilityId: "braveAxeSaltarello",
};
const molussoLiven: StatusEffectSource = {
  characterId: "molussoEx",
  abilityId: "liven",
};
const crimsonCondemnerAura: StatusEffectSource = {
  characterId: "crimsonCondemner",
  abilityId: "auraOfRedHeartAll5",
};
const rocbouquetSingleMindedLove: StatusEffectSource = {
  characterId: "rocbouquet",
  abilityId: "singleMindedLove",
};
/** 覚醒アクセサリー「真心のポーチ」。装備者（自身）にだけ掛かるので、装備者の ID で表す。 */
const finalEmpressSincerityPouch: StatusEffectSource = {
  characterId: "finalEmpressFemale",
  abilityId: "sincerityPouch",
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
        { characterId: "viola", abilityId: "antiAttack2" },
      ],
      expected: true,
    },
    {
      name: "同名アビリティでもキャラが違えば別の付与元",
      args: [
        { characterId: "cress", abilityId: "backstab" },
        { characterId: "duran", abilityId: "backstab" },
      ],
      expected: false,
    },
    {
      name: "同じキャラでもアビリティが違えば別の付与元",
      args: [violaAntiAttack2, { characterId: "viola", abilityId: "other" }],
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
            source: { characterId: "cress", abilityId: "backstab" },
          }),
          createApplication({
            kind: "physicalDefenseDown",
            magnitude: 15,
            source: { characterId: "duran", abilityId: "backstab" },
          }),
        ],
        expected: [
          createPool({
            kind: "physicalDefenseDown",
            timedMagnitude: 30,
            remainingTurns: 4,
            timedSources: [
              { characterId: "cress", abilityId: "backstab" },
              { characterId: "duran", abilityId: "backstab" },
            ],
          }),
        ],
      },
      {
        name: "1 回の行動で同じ付与元が 4 回当たると、効果量そのままでターンが 4 倍になる（風切り羽）",
        applications: Array.from({ length: 4 }, () =>
          createApplication({
            magnitude: 15,
            source: { characterId: "chloe", abilityId: "kazakiribane" },
          }),
        ),
        expected: [
          createPool({
            timedMagnitude: 15,
            remainingTurns: 8,
            timedSources: [{ characterId: "chloe", abilityId: "kazakiribane" }],
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
            source: { characterId: "francesca", abilityId: "hametsuNoUta" },
            stacksWithSameSource: true,
          }),
          createApplication({
            magnitude: 10,
            source: { characterId: "francesca", abilityId: "hametsuNoUta" },
            stacksWithSameSource: true,
          }),
        ],
        expected: [
          createPool({
            timedMagnitude: 20,
            remainingTurns: 4,
            timedSources: [
              { characterId: "francesca", abilityId: "hametsuNoUta" },
            ],
          }),
        ],
      },
      {
        name: "ブースト MAX 時重複可のアビリティは、通常時と MAX 時を区別で分けて加算する（雷獣の詩）",
        applications: [
          createApplication({
            magnitude: 15,
            source: { characterId: "titi", abilityId: "raijuNoUta" },
          }),
          createApplication({
            magnitude: 15,
            source: {
              characterId: "titi",
              abilityId: "raijuNoUta",
              variant: "boostMax",
            },
          }),
          createApplication({
            magnitude: 15,
            source: {
              characterId: "titi",
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
              { characterId: "titi", abilityId: "raijuNoUta" },
              {
                characterId: "titi",
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
            source: { characterId: "lynette", abilityId: "tatsujinNoKobu3" },
          }),
          createApplication({
            slot: "ultimate",
            kind: "physicalAttackUp",
            duration: turns(3),
            source: { characterId: "primrose", abilityId: "ultimate" },
          }),
        ],
        expected: [
          createPool({
            kind: "physicalAttackUp",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [
              { characterId: "lynette", abilityId: "tatsujinNoKobu3" },
            ],
          }),
          createPool({
            slot: "ultimate",
            kind: "physicalAttackUp",
            timedMagnitude: 20,
            remainingTurns: 3,
            timedSources: [{ characterId: "primrose", abilityId: "ultimate" }],
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
