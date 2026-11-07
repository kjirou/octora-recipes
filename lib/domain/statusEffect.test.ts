import { describe, expect, it, test } from "vitest";

import type {
  StatusEffectApplication,
  StatusEffectKind,
  StatusEffectState,
} from "@/lib/types";

import {
  applyStatusEffect,
  elapseStatusEffectTurn,
  findStatusEffectPool,
  getStatusEffectMagnitude,
  getStatusEffectRemainingTurns,
  isSameStatusEffectKind,
} from "./statusEffect";

const physicalAttack: StatusEffectKind = {
  category: "parameter",
  parameter: "physicalAttack",
};
const elementalAttack: StatusEffectKind = {
  category: "parameter",
  parameter: "elementalAttack",
};
const bowResistance: StatusEffectKind = {
  category: "resistance",
  attackType: "bow",
};

/** テスト用に、省略可能な項目を埋めた付与内容を作る。 */
const createApplication = (
  overrides: Partial<StatusEffectApplication> = {},
): StatusEffectApplication => ({
  slot: "battleAbility",
  polarity: "debuff",
  kind: physicalAttack,
  magnitude: 20,
  turns: 2,
  sourceKey: "viola:antiAttack2",
  ...overrides,
});

/** 付与内容を順に適用した結果を返す。 */
const applyAll = (
  applications: StatusEffectApplication[],
  initial: StatusEffectState = [],
): StatusEffectState =>
  applications.reduce(
    (state, application) => applyStatusEffect(state, application),
    initial,
  );

describe("isSameStatusEffectKind", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isSameStatusEffectKind>;
    expected: ReturnType<typeof isSameStatusEffectKind>;
  }>([
    {
      name: "同じパラメーターなら同じ種類",
      args: [
        physicalAttack,
        { category: "parameter", parameter: "physicalAttack" },
      ],
      expected: true,
    },
    {
      name: "違うパラメーターなら違う種類",
      args: [physicalAttack, elementalAttack],
      expected: false,
    },
    {
      name: "同じ攻撃種別の耐性なら同じ種類",
      args: [bowResistance, { category: "resistance", attackType: "bow" }],
      expected: true,
    },
    {
      name: "違う攻撃種別の耐性なら違う種類",
      args: [bowResistance, { category: "resistance", attackType: "fire" }],
      expected: false,
    },
    {
      name: "パラメーターと耐性は違う種類",
      args: [physicalAttack, bowResistance],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isSameStatusEffectKind(...args)).toBe(expected);
  });
});

describe("findStatusEffectPool", () => {
  const state = applyAll([
    createApplication(),
    createApplication({ polarity: "buff", sourceKey: "a" }),
    createApplication({ slot: "ultimate", sourceKey: "b" }),
  ]);

  test.each<{
    name: string;
    args: Parameters<typeof findStatusEffectPool>;
    expected: ReturnType<typeof findStatusEffectPool>;
  }>([
    {
      name: "枠・向き・種類がすべて一致するまとまりを返す",
      args: [state, "battleAbility", "debuff", physicalAttack],
      expected: {
        slot: "battleAbility",
        polarity: "debuff",
        kind: physicalAttack,
        magnitude: 20,
        remainingTurns: 2,
        sourceKeys: ["viola:antiAttack2"],
      },
    },
    {
      name: "向きが違えば別のまとまりを返す",
      args: [state, "battleAbility", "buff", physicalAttack],
      expected: {
        slot: "battleAbility",
        polarity: "buff",
        kind: physicalAttack,
        magnitude: 20,
        remainingTurns: 2,
        sourceKeys: ["a"],
      },
    },
    {
      name: "枠が違えば別のまとまりを返す",
      args: [state, "ultimate", "debuff", physicalAttack],
      expected: {
        slot: "ultimate",
        polarity: "debuff",
        kind: physicalAttack,
        magnitude: 20,
        remainingTurns: 2,
        sourceKeys: ["b"],
      },
    },
    {
      name: "種類が一致しなければ undefined",
      args: [state, "battleAbility", "debuff", elementalAttack],
      expected: undefined,
    },
    {
      name: "空の状態なら undefined",
      args: [[], "battleAbility", "debuff", physicalAttack],
      expected: undefined,
    },
  ])("$name", ({ args, expected }) => {
    expect(findStatusEffectPool(...args)).toStrictEqual(expected);
  });
});

describe("getStatusEffectMagnitude", () => {
  const state = applyAll([createApplication({ magnitude: 15 })]);

  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectMagnitude>;
    expected: ReturnType<typeof getStatusEffectMagnitude>;
  }>([
    {
      name: "かかっている効果量を返す",
      args: [state, "battleAbility", "debuff", physicalAttack],
      expected: 15,
    },
    {
      name: "かかっていなければ 0",
      args: [state, "supportAbility", "debuff", physicalAttack],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectMagnitude(...args)).toBe(expected);
  });
});

describe("getStatusEffectRemainingTurns", () => {
  const state = applyAll([createApplication({ turns: 3 })]);

  test.each<{
    name: string;
    args: Parameters<typeof getStatusEffectRemainingTurns>;
    expected: ReturnType<typeof getStatusEffectRemainingTurns>;
  }>([
    {
      name: "残りターン数を返す",
      args: [state, "battleAbility", "debuff", physicalAttack],
      expected: 3,
    },
    {
      name: "かかっていなければ 0",
      args: [state, "battleAbility", "buff", physicalAttack],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectRemainingTurns(...args)).toBe(expected);
  });
});

describe("applyStatusEffect", () => {
  describe("効果量と継続ターンの重複", () => {
    test.each<{
      name: string;
      applications: StatusEffectApplication[];
      expected: StatusEffectState;
    }>([
      {
        name: "何もかかっていない対象に付与すると、そのまま新しいまとまりになる",
        applications: [createApplication()],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["viola:antiAttack2"],
          },
        ],
      },
      {
        name: "同じ付与元を重ねると効果量は増えず、ターンだけ合算される（アンチアタックⅡ ×2）",
        applications: [createApplication(), createApplication()],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 4,
            sourceKeys: ["viola:antiAttack2"],
          },
        ],
      },
      {
        name: "違う付与元を重ねると効果量が加算され、30% で止まる（アンチアタックⅡ 20% + 天鼠 15%）",
        applications: [
          createApplication(),
          createApplication({ magnitude: 15, sourceKey: "therion:tenso" }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 30,
            remainingTurns: 4,
            sourceKeys: ["viola:antiAttack2", "therion:tenso"],
          },
        ],
      },
      {
        name: "同名アビリティでも使用キャラが違えば付与元が違うので加算される（バックスタッブ）",
        applications: [
          createApplication({
            kind: { category: "parameter", parameter: "physicalDefense" },
            magnitude: 15,
            sourceKey: "cress:backstab",
          }),
          createApplication({
            kind: { category: "parameter", parameter: "physicalDefense" },
            magnitude: 15,
            sourceKey: "duran:backstab",
          }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: { category: "parameter", parameter: "physicalDefense" },
            magnitude: 30,
            remainingTurns: 4,
            sourceKeys: ["cress:backstab", "duran:backstab"],
          },
        ],
      },
      {
        name: "1 回の行動で同じ付与元が 4 回当たると、効果量そのままでターンが 4 倍になる（風切り羽）",
        applications: Array.from({ length: 4 }, () =>
          createApplication({
            kind: bowResistance,
            magnitude: 15,
            sourceKey: "chloe:kazakiribane",
          }),
        ),
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: bowResistance,
            magnitude: 15,
            remainingTurns: 8,
            sourceKeys: ["chloe:kazakiribane"],
          },
        ],
      },
      {
        name: "継続ターンは 9 で止まる",
        applications: Array.from({ length: 5 }, () =>
          createApplication({ turns: 2 }),
        ),
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 9,
            sourceKeys: ["viola:antiAttack2"],
          },
        ],
      },
      {
        name: "1 回で 30% を超える付与は 30% に丸められ、ターンも 9 に丸められる",
        applications: [createApplication({ magnitude: 40, turns: 12 })],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 30,
            remainingTurns: 9,
            sourceKeys: ["viola:antiAttack2"],
          },
        ],
      },
      {
        name: "同じ付与元でも重複可の指定があれば効果量が加算される（支援者 破滅の詩 ×2）",
        applications: [
          createApplication({
            magnitude: 10,
            sourceKey: "supporter:francesca",
            stacksWithSameSource: true,
          }),
          createApplication({
            magnitude: 10,
            sourceKey: "supporter:francesca",
            stacksWithSameSource: true,
          }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 4,
            sourceKeys: ["supporter:francesca"],
          },
        ],
      },
      {
        name: "ブースト MAX 時重複可のアビリティは、通常時と MAX 時を別の付与元として加算する（雷獣の詩）",
        applications: [
          createApplication({ magnitude: 15, sourceKey: "titi:raijuNoUta" }),
          createApplication({
            magnitude: 15,
            sourceKey: "titi:raijuNoUta:boostMax",
          }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 30,
            remainingTurns: 4,
            sourceKeys: ["titi:raijuNoUta", "titi:raijuNoUta:boostMax"],
          },
        ],
      },
      {
        name: "枠が違えば効果量もターンも別々に管理される（達人の鼓舞Ⅲ + 必殺技 撫でし子の舞）",
        applications: [
          createApplication({
            polarity: "buff",
            magnitude: 20,
            turns: 2,
            sourceKey: "lynette:tatsujinNoKobu3",
          }),
          createApplication({
            slot: "ultimate",
            polarity: "buff",
            magnitude: 20,
            turns: 3,
            sourceKey: "primrose:ultimate",
          }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "buff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["lynette:tatsujinNoKobu3"],
          },
          {
            slot: "ultimate",
            polarity: "buff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 3,
            sourceKeys: ["primrose:ultimate"],
          },
        ],
      },
      {
        name: "同じ枠でも種類が違えば別々に管理される（物攻ダウンと属攻ダウン）",
        applications: [
          createApplication({ kind: physicalAttack }),
          createApplication({ kind: elementalAttack }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["viola:antiAttack2"],
          },
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: elementalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["viola:antiAttack2"],
          },
        ],
      },
      {
        name: "同じ種類でもバフとデバフは別々に管理される（相殺しない）",
        applications: [
          createApplication({ polarity: "buff", sourceKey: "a" }),
          createApplication({ polarity: "debuff", sourceKey: "b" }),
        ],
        expected: [
          {
            slot: "battleAbility",
            polarity: "buff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["a"],
          },
          {
            slot: "battleAbility",
            polarity: "debuff",
            kind: physicalAttack,
            magnitude: 20,
            remainingTurns: 2,
            sourceKeys: ["b"],
          },
        ],
      },
    ])("$name", ({ applications, expected }) => {
      expect(applyAll(applications)).toStrictEqual(expected);
    });
  });

  describe("効果量の上限の変更", () => {
    it("上限を 50% にすると 30% を超えて加算される", () => {
      const state = applyStatusEffect(
        applyAll([createApplication({ magnitude: 30 })]),
        createApplication({ magnitude: 25, sourceKey: "other" }),
        { magnitudeCap: 50 },
      );
      expect(
        getStatusEffectMagnitude(
          state,
          "battleAbility",
          "debuff",
          physicalAttack,
        ),
      ).toBe(50);
    });
  });

  describe("不変性", () => {
    it("元の状態を変更しない", () => {
      const before = applyAll([createApplication()]);
      const snapshot = structuredClone(before);
      applyStatusEffect(before, createApplication({ sourceKey: "other" }));
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
        name: "継続ターンが 0 なら例外",
        application: createApplication({ turns: 0 }),
        expected: "継続ターンは 1 以上の整数である必要があります",
      },
      {
        name: "継続ターンが整数でなければ例外",
        application: createApplication({ turns: 1.5 }),
        expected: "継続ターンは 1 以上の整数である必要があります",
      },
    ])("$name", ({ application, expected }) => {
      expect(() => applyStatusEffect([], application)).toThrow(expected);
    });
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
          createApplication({ turns: 3 }),
          createApplication({ slot: "ultimate", turns: 2, sourceKey: "u" }),
        ]),
      ],
      expected: [
        {
          slot: "battleAbility",
          polarity: "debuff",
          kind: physicalAttack,
          magnitude: 20,
          remainingTurns: 2,
          sourceKeys: ["viola:antiAttack2"],
        },
        {
          slot: "ultimate",
          polarity: "debuff",
          kind: physicalAttack,
          magnitude: 20,
          remainingTurns: 1,
          sourceKeys: ["u"],
        },
      ],
    },
    {
      name: "残りターンが 1 のまとまりは取り除かれる",
      args: [applyAll([createApplication({ turns: 1 })])],
      expected: [],
    },
    {
      name: "空の状態は空のまま",
      args: [[]],
      expected: [],
    },
  ])("$name", ({ args, expected }) => {
    expect(elapseStatusEffectTurn(...args)).toStrictEqual(expected);
  });

  it("元の状態を変更しない", () => {
    const before = applyAll([createApplication({ turns: 2 })]);
    const snapshot = structuredClone(before);
    elapseStatusEffectTurn(before);
    expect(before).toStrictEqual(snapshot);
  });
});

describe("ターンをまたいだシナリオ", () => {
  it("1 ターン目に 10%（2 ターン）、2 ターン目に別技で 20%（2 ターン）を付与すると、2〜4 ターン目は 30% になる", () => {
    const kind = physicalAttack;
    const read = (state: StatusEffectState) => ({
      magnitude: getStatusEffectMagnitude(state, "battleAbility", "buff", kind),
      remainingTurns: getStatusEffectRemainingTurns(
        state,
        "battleAbility",
        "buff",
        kind,
      ),
    });

    // 1 ターン目
    let state = applyStatusEffect(
      [],
      createApplication({
        polarity: "buff",
        magnitude: 10,
        turns: 2,
        sourceKey: "a",
      }),
    );
    expect(read(state)).toStrictEqual({ magnitude: 10, remainingTurns: 2 });
    state = elapseStatusEffectTurn(state);

    // 2 ターン目: 残り 1 ターンに 2 ターン分が足されて 3 ターンになる
    state = applyStatusEffect(
      state,
      createApplication({
        polarity: "buff",
        magnitude: 20,
        turns: 2,
        sourceKey: "b",
      }),
    );
    expect(read(state)).toStrictEqual({ magnitude: 30, remainingTurns: 3 });
    state = elapseStatusEffectTurn(state);

    // 3 ターン目
    expect(read(state)).toStrictEqual({ magnitude: 30, remainingTurns: 2 });
    state = elapseStatusEffectTurn(state);

    // 4 ターン目: 効果量は切れる直前まで 30% のまま
    expect(read(state)).toStrictEqual({ magnitude: 30, remainingTurns: 1 });
    state = elapseStatusEffectTurn(state);

    // 5 ターン目: 消えている
    expect(read(state)).toStrictEqual({ magnitude: 0, remainingTurns: 0 });
  });

  it("切れる前にどちらの技で延長しても 30% が維持される", () => {
    let state = applyAll([
      createApplication({
        polarity: "buff",
        magnitude: 10,
        turns: 2,
        sourceKey: "a",
      }),
      createApplication({
        polarity: "buff",
        magnitude: 20,
        turns: 2,
        sourceKey: "b",
      }),
    ]);
    state = elapseStatusEffectTurn(
      elapseStatusEffectTurn(elapseStatusEffectTurn(state)),
    );
    expect(
      getStatusEffectRemainingTurns(
        state,
        "battleAbility",
        "buff",
        physicalAttack,
      ),
    ).toBe(1);

    state = applyStatusEffect(
      state,
      createApplication({
        polarity: "buff",
        magnitude: 10,
        turns: 2,
        sourceKey: "a",
      }),
    );
    expect(
      getStatusEffectMagnitude(state, "battleAbility", "buff", physicalAttack),
    ).toBe(30);
    expect(
      getStatusEffectRemainingTurns(
        state,
        "battleAbility",
        "buff",
        physicalAttack,
      ),
    ).toBe(3);
  });
});
