import { describe, expect, test } from "vitest";

import type {
  PowerUpApplication,
  PowerUpPool,
  PowerUpState,
  PowerUpTarget,
  StatusEffectDuration,
  StatusEffectSource,
} from "@/lib/types";

import {
  applyPowerUp,
  createEmptyPowerUpState,
  elapsePowerUpTurn,
  findPowerUpPool,
  getEffectivePowerUpMagnitude,
  getPowerUpMagnitudeByStacking,
  getPowerUpPoolMagnitude,
  isSamePowerUpTarget,
  removePermanentPowerUp,
} from "./powerUp";

const permanent: StatusEffectDuration = { type: "permanent" };
const turns = (turns: number): StatusEffectDuration => ({
  type: "turns",
  turns,
});

const any: PowerUpTarget = { type: "any" };
const fire: PowerUpTarget = { type: "attackType", attackType: "fire" };
const ice: PowerUpTarget = { type: "attackType", attackType: "ice" };

const osvaldPriceOfMagic: StatusEffectSource = {
  type: "activeAbility",
  characterId: "cleric:ozubarudo",
  abilityId: "priceOfMagic",
};
const violaEssenceOfDivineWeapon: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "warrior:viora",
  abilityId: "essenceOfDivineWeapon",
};
const fireAmplifier: StatusEffectSource = {
  type: "equipment",
  characterId: "warrior:viora",
  equipmentId: "fireMagicAmplifier",
};
const huntressWeapon: StatusEffectSource = {
  type: "equipment",
  characterId: "warrior:viora",
  equipmentId: "huntressWeapon4",
};
/** 無条件のターン無し効果の付与元（剣士 ヴィオラとは別の付与元）。 */
const unconditionalPermanentSource: StatusEffectSource = {
  type: "passiveAbility",
  characterId: "other",
  abilityId: "unconditionalPermanentPowerUp",
};
/** バトアビで威力アップを付与する、神官 オズバルドとは別の付与元。 */
const otherBattleAbilitySource: StatusEffectSource = {
  type: "activeAbility",
  characterId: "other",
  abilityId: "battleAbilityPowerUp",
};

/** テスト用に、省略可能な項目を埋めた付与内容を作る。 */
const createApplication = (
  overrides: Partial<PowerUpApplication> = {},
): PowerUpApplication => ({
  slot: "battleAbility",
  target: any,
  stacking: "base",
  magnitude: 100,
  duration: turns(2),
  source: osvaldPriceOfMagic,
  ...overrides,
});

/** テスト用に、省略可能な項目を埋めたまとまりを作る。 */
const createPool = (overrides: Partial<PowerUpPool> = {}): PowerUpPool => ({
  slot: "battleAbility",
  target: any,
  stacking: "base",
  permanentSources: [],
  timedMagnitude: 0,
  remainingTurns: 0,
  ...overrides,
});

const createState = (pools: PowerUpPool[] = []): PowerUpState => ({ pools });

/** 付与内容を順に適用した結果を返す。 */
const applyAll = (applications: PowerUpApplication[]): PowerUpState =>
  applications.reduce(applyPowerUp, createEmptyPowerUpState());

describe("createEmptyPowerUpState", () => {
  test("まとまりが空の状態を返す", () => {
    expect(createEmptyPowerUpState()).toStrictEqual({ pools: [] });
  });
});

describe("isSamePowerUpTarget", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isSamePowerUpTarget>;
    expected: ReturnType<typeof isSamePowerUpTarget>;
  }>([
    { name: "無条件同士は同じ", args: [any, any], expected: true },
    { name: "同じ攻撃種別同士は同じ", args: [fire, fire], expected: true },
    { name: "違う攻撃種別同士は違う", args: [fire, ice], expected: false },
    { name: "無条件と攻撃種別は違う", args: [any, fire], expected: false },
    { name: "攻撃種別と無条件は違う", args: [fire, any], expected: false },
  ])("$name", ({ args, expected }) => {
    expect(isSamePowerUpTarget(...args)).toBe(expected);
  });
});

describe("findPowerUpPool", () => {
  const anyBase = createPool({ timedMagnitude: 100, remainingTurns: 2 });
  const fireBase = createPool({
    target: fire,
    timedMagnitude: 75,
    remainingTurns: 2,
  });
  const anyAdditive = createPool({
    stacking: "additive",
    timedMagnitude: 30,
    remainingTurns: 2,
  });
  const state = createState([anyBase, fireBase, anyAdditive]);

  test.each<{
    name: string;
    args: Parameters<typeof findPowerUpPool>;
    expected: ReturnType<typeof findPowerUpPool>;
  }>([
    {
      name: "枠・対象・区分が一致するまとまりを返す",
      args: [state, "battleAbility", any, "base"],
      expected: anyBase,
    },
    {
      name: "対象の攻撃種別で区別する",
      args: [state, "battleAbility", fire, "base"],
      expected: fireBase,
    },
    {
      name: "区分で区別する",
      args: [state, "battleAbility", any, "additive"],
      expected: anyAdditive,
    },
    {
      name: "枠が違えば undefined",
      args: [state, "ultimate", any, "base"],
      expected: undefined,
    },
  ])("$name", ({ args, expected }) => {
    expect(findPowerUpPool(...args)).toBe(expected);
  });
});

describe("getPowerUpPoolMagnitude", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getPowerUpPoolMagnitude>;
    expected: ReturnType<typeof getPowerUpPoolMagnitude>;
  }>([
    {
      name: "まとまりが無ければ 0",
      args: [createState(), "battleAbility", any, "base"],
      expected: 0,
    },
    {
      name: "ターン付きの効果量を返す",
      args: [
        createState([createPool({ timedMagnitude: 100, remainingTurns: 2 })]),
        "battleAbility",
        any,
        "base",
      ],
      expected: 100,
    },
    {
      name: "ターン無しとターン付きは合算せず高い方を返す",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 150 },
            ],
            timedMagnitude: 100,
            remainingTurns: 2,
          }),
        ]),
        "battleAbility",
        any,
        "base",
      ],
      expected: 150,
    },
    {
      name: "ターン無し効果同士も合算せず高い方を返す",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 100 },
              { source: unconditionalPermanentSource, magnitude: 75 },
            ],
          }),
        ]),
        "battleAbility",
        any,
        "base",
      ],
      expected: 100,
    },
  ])("$name", ({ args, expected }) => {
    expect(getPowerUpPoolMagnitude(...args)).toBe(expected);
  });
});

describe("getPowerUpMagnitudeByStacking", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getPowerUpMagnitudeByStacking>;
    expected: ReturnType<typeof getPowerUpMagnitudeByStacking>;
  }>([
    {
      name: "何もかかっていなければ 0",
      args: [createState(), "fire", "base"],
      expected: 0,
    },
    {
      name: "枠をまたいで加算せず最大値を返す",
      args: [
        createState([
          createPool({ timedMagnitude: 100, remainingTurns: 2 }),
          createPool({
            slot: "ultimate",
            timedMagnitude: 100,
            remainingTurns: 2,
          }),
        ]),
        "sword",
        "base",
      ],
      expected: 100,
    },
    {
      name: "より高い枠があればその値を返す",
      args: [
        createState([
          createPool({ timedMagnitude: 100, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 150 },
            ],
          }),
        ]),
        "sword",
        "base",
      ],
      expected: 150,
    },
    {
      name: "該当する攻撃種別のまとまりを含める",
      args: [
        createState([
          createPool({ timedMagnitude: 50, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            target: fire,
            permanentSources: [{ source: fireAmplifier, magnitude: 75 }],
          }),
        ]),
        "fire",
        "base",
      ],
      expected: 75,
    },
    {
      name: "攻撃種別限定より無条件が高ければ無条件の値を返す",
      args: [
        createState([
          createPool({ timedMagnitude: 100, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            target: fire,
            permanentSources: [{ source: fireAmplifier, magnitude: 75 }],
          }),
        ]),
        "fire",
        "base",
      ],
      expected: 100,
    },
    {
      name: "該当しない攻撃種別のまとまりは含めない",
      args: [
        createState([
          createPool({
            slot: "supportAbility",
            target: fire,
            permanentSources: [{ source: fireAmplifier, magnitude: 75 }],
          }),
        ]),
        "ice",
        "base",
      ],
      expected: 0,
    },
    {
      name: "区分が違うまとまりは含めない",
      args: [
        createState([
          createPool({
            slot: "supportAbility",
            stacking: "additive",
            permanentSources: [{ source: huntressWeapon, magnitude: 30 }],
          }),
        ]),
        "sword",
        "base",
      ],
      expected: 0,
    },
    {
      name: "無属性攻撃には無条件のまとまりを含める",
      args: [
        createState([createPool({ timedMagnitude: 100, remainingTurns: 2 })]),
        "nonElemental",
        "base",
      ],
      expected: 100,
    },
    {
      name: "無属性攻撃には攻撃種別限定のまとまりを含めない",
      args: [
        createState([
          createPool({ timedMagnitude: 50, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            target: fire,
            permanentSources: [{ source: fireAmplifier, magnitude: 75 }],
          }),
        ]),
        "nonElemental",
        "base",
      ],
      expected: 50,
    },
  ])("$name", ({ args, expected }) => {
    expect(getPowerUpMagnitudeByStacking(...args)).toBe(expected);
  });
});

describe("getEffectivePowerUpMagnitude", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getEffectivePowerUpMagnitude>;
    expected: ReturnType<typeof getEffectivePowerUpMagnitude>;
  }>([
    {
      name: "何もかかっていなければ 0",
      args: [createState(), "sword"],
      expected: 0,
    },
    {
      name: "ベースの有効値と加算の有効値を足す",
      args: [
        createState([
          createPool({ timedMagnitude: 100, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            stacking: "additive",
            permanentSources: [{ source: huntressWeapon, magnitude: 30 }],
          }),
        ]),
        "sword",
      ],
      expected: 130,
    },
    {
      name: "加算も枠をまたいで最大値を取る",
      args: [
        createState([
          createPool({
            stacking: "additive",
            timedMagnitude: 20,
            remainingTurns: 2,
          }),
          createPool({
            slot: "supportAbility",
            stacking: "additive",
            permanentSources: [{ source: huntressWeapon, magnitude: 30 }],
          }),
        ]),
        "sword",
      ],
      expected: 30,
    },
    {
      name: "無属性攻撃にも無条件のベースと加算を足す",
      args: [
        createState([
          createPool({ timedMagnitude: 100, remainingTurns: 2 }),
          createPool({
            slot: "supportAbility",
            stacking: "additive",
            permanentSources: [{ source: huntressWeapon, magnitude: 30 }],
          }),
          createPool({
            slot: "supportAbility",
            target: fire,
            permanentSources: [{ source: fireAmplifier, magnitude: 150 }],
          }),
        ]),
        "nonElemental",
      ],
      expected: 130,
    },
  ])("$name", ({ args, expected }) => {
    expect(getEffectivePowerUpMagnitude(...args)).toBe(expected);
  });
});

describe("applyPowerUp", () => {
  test.each<{
    name: string;
    applications: PowerUpApplication[];
    expected: PowerUpState;
  }>([
    {
      name: "ターン付き効果を新しいまとまりとして追加する",
      applications: [createApplication()],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 2 }),
      ]),
    },
    {
      name: "ターン無し効果を新しいまとまりとして追加する",
      applications: [
        createApplication({
          slot: "supportAbility",
          duration: permanent,
          source: violaEssenceOfDivineWeapon,
        }),
      ],
      expected: createState([
        createPool({
          slot: "supportAbility",
          permanentSources: [
            { source: violaEssenceOfDivineWeapon, magnitude: 100 },
          ],
        }),
      ]),
    },
    {
      name: "同じまとまりへの再付与は残りターンを合算せず長い方を残す",
      applications: [
        createApplication({ duration: turns(3) }),
        createApplication({ duration: turns(2) }),
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 3 }),
      ]),
    },
    {
      name: "残りターンより長い再付与は残りターンを置き換える",
      applications: [
        createApplication({ duration: turns(2) }),
        createApplication({ duration: turns(4) }),
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 4 }),
      ]),
    },
    {
      name: "付与元が違っても効果量は合算せず高い方を残す",
      applications: [
        createApplication({ magnitude: 150, duration: turns(1) }),
        createApplication({
          magnitude: 100,
          duration: turns(3),
          source: otherBattleAbilitySource,
        }),
      ],
      expected: createState([
        createPool({ timedMagnitude: 150, remainingTurns: 3 }),
      ]),
    },
    {
      name: "同じ付与元のターン無し効果の再付与は効果量を差し替える",
      applications: [
        createApplication({
          slot: "supportAbility",
          magnitude: 150,
          duration: permanent,
          source: violaEssenceOfDivineWeapon,
        }),
        createApplication({
          slot: "supportAbility",
          magnitude: 100,
          duration: permanent,
          source: violaEssenceOfDivineWeapon,
        }),
      ],
      expected: createState([
        createPool({
          slot: "supportAbility",
          permanentSources: [
            { source: violaEssenceOfDivineWeapon, magnitude: 100 },
          ],
        }),
      ]),
    },
    {
      name: "別の付与元のターン無し効果は並存する",
      applications: [
        createApplication({
          slot: "supportAbility",
          duration: permanent,
          source: violaEssenceOfDivineWeapon,
        }),
        createApplication({
          slot: "supportAbility",
          magnitude: 75,
          duration: permanent,
          source: unconditionalPermanentSource,
        }),
      ],
      expected: createState([
        createPool({
          slot: "supportAbility",
          permanentSources: [
            { source: violaEssenceOfDivineWeapon, magnitude: 100 },
            { source: unconditionalPermanentSource, magnitude: 75 },
          ],
        }),
      ]),
    },
    {
      name: "枠・対象・区分が違えば別のまとまりになる",
      applications: [
        createApplication(),
        createApplication({ slot: "ultimate" }),
        createApplication({ target: fire }),
        createApplication({ stacking: "additive" }),
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 2 }),
        createPool({
          slot: "ultimate",
          timedMagnitude: 100,
          remainingTurns: 2,
        }),
        createPool({ target: fire, timedMagnitude: 100, remainingTurns: 2 }),
        createPool({
          stacking: "additive",
          timedMagnitude: 100,
          remainingTurns: 2,
        }),
      ]),
    },
  ])("$name", ({ applications, expected }) => {
    expect(applyAll(applications)).toStrictEqual(expected);
  });

  test("元の状態を変更しない", () => {
    const state = applyAll([createApplication()]);
    const snapshot = structuredClone(state);
    applyPowerUp(state, createApplication({ magnitude: 200 }));
    expect(state).toStrictEqual(snapshot);
  });

  test.each<{
    name: string;
    application: PowerUpApplication;
    expected: string;
  }>([
    {
      name: "効果量が 0 なら例外",
      application: createApplication({ magnitude: 0 }),
      expected: "効果量は正の数である必要があります",
    },
    {
      name: "効果量が負なら例外",
      application: createApplication({ magnitude: -1 }),
      expected: "効果量は正の数である必要があります",
    },
    {
      name: "効果量が NaN なら例外",
      application: createApplication({ magnitude: Number.NaN }),
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
    expect(() => applyPowerUp(createEmptyPowerUpState(), application)).toThrow(
      expected,
    );
  });
});

describe("removePermanentPowerUp", () => {
  test.each<{
    name: string;
    args: Parameters<typeof removePermanentPowerUp>;
    expected: ReturnType<typeof removePermanentPowerUp>;
  }>([
    {
      name: "指定した付与元のターン無し効果を取り除き、空になったまとまりを消す",
      args: [
        createState([
          createPool({
            slot: "supportAbility",
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 100 },
            ],
          }),
        ]),
        violaEssenceOfDivineWeapon,
      ],
      expected: createState(),
    },
    {
      name: "ターン付き効果が残るまとまりは残す",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 150 },
            ],
            timedMagnitude: 100,
            remainingTurns: 2,
          }),
        ]),
        violaEssenceOfDivineWeapon,
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 2 }),
      ]),
    },
    {
      name: "他の付与元のターン無し効果は残す",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 100 },
              { source: unconditionalPermanentSource, magnitude: 75 },
            ],
          }),
        ]),
        violaEssenceOfDivineWeapon,
      ],
      expected: createState([
        createPool({
          permanentSources: [
            { source: unconditionalPermanentSource, magnitude: 75 },
          ],
        }),
      ]),
    },
    {
      name: "ターン付き効果の付与元を指定しても影響しない",
      args: [
        createState([createPool({ timedMagnitude: 100, remainingTurns: 2 })]),
        osvaldPriceOfMagic,
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 2 }),
      ]),
    },
  ])("$name", ({ args, expected }) => {
    expect(removePermanentPowerUp(...args)).toStrictEqual(expected);
  });
});

describe("elapsePowerUpTurn", () => {
  test.each<{
    name: string;
    args: Parameters<typeof elapsePowerUpTurn>;
    expected: ReturnType<typeof elapsePowerUpTurn>;
  }>([
    {
      name: "残りターンを 1 減らす",
      args: [
        createState([createPool({ timedMagnitude: 100, remainingTurns: 2 })]),
      ],
      expected: createState([
        createPool({ timedMagnitude: 100, remainingTurns: 1 }),
      ]),
    },
    {
      name: "残りターンが 0 になったらまとまりを消す",
      args: [
        createState([createPool({ timedMagnitude: 100, remainingTurns: 1 })]),
      ],
      expected: createState(),
    },
    {
      name: "ターン付き効果が切れてもターン無し効果は残る",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 100 },
            ],
            timedMagnitude: 150,
            remainingTurns: 1,
          }),
        ]),
      ],
      expected: createState([
        createPool({
          permanentSources: [
            { source: violaEssenceOfDivineWeapon, magnitude: 100 },
          ],
        }),
      ]),
    },
    {
      name: "ターン無し効果だけのまとまりは変わらない",
      args: [
        createState([
          createPool({
            permanentSources: [
              { source: violaEssenceOfDivineWeapon, magnitude: 100 },
            ],
          }),
        ]),
      ],
      expected: createState([
        createPool({
          permanentSources: [
            { source: violaEssenceOfDivineWeapon, magnitude: 100 },
          ],
        }),
      ]),
    },
  ])("$name", ({ args, expected }) => {
    expect(elapsePowerUpTurn(...args)).toStrictEqual(expected);
  });
});
