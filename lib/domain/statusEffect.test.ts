import { describe, expect, it, test } from "vitest";

import type {
  StatusEffectApplication,
  StatusEffectDuration,
  StatusEffectKind,
  StatusEffectPool,
  StatusEffectSource,
  StatusEffectState,
} from "@/lib/types";

import {
  applyStatusEffect,
  elapseStatusEffectTurn,
  findStatusEffectPool,
  getStatusEffectMagnitude,
  getStatusEffectRemainingTurns,
  isSameStatusEffectKind,
  isSameStatusEffectSource,
  removePermanentStatusEffect,
} from "./statusEffect";

const physicalAttack: StatusEffectKind = {
  category: "parameter",
  parameter: "physicalAttack",
};
const elementalAttack: StatusEffectKind = {
  category: "parameter",
  parameter: "elementalAttack",
};
const physicalDefense: StatusEffectKind = {
  category: "parameter",
  parameter: "physicalDefense",
};

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

/** テスト用に、省略可能な項目を埋めた付与内容を作る。 */
const createApplication = (
  overrides: Partial<StatusEffectApplication> = {},
): StatusEffectApplication => ({
  slot: "battleAbility",
  polarity: "debuff",
  kind: physicalAttack,
  magnitude: 20,
  duration: turns(2),
  source: violaAntiAttack2,
  ...overrides,
});

/** テスト用に、省略可能な項目を埋めたまとまりを作る。 */
const createPool = (
  overrides: Partial<StatusEffectPool> = {},
): StatusEffectPool => ({
  slot: "battleAbility",
  polarity: "debuff",
  kind: physicalAttack,
  permanentSources: [],
  timedMagnitude: 0,
  remainingTurns: 0,
  timedSources: [],
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
  ])("$name", ({ args, expected }) => {
    expect(isSameStatusEffectKind(...args)).toBe(expected);
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
    createApplication({ polarity: "buff", source: sourceA }),
    createApplication({ slot: "ultimate", source: sourceB }),
  ]);

  test.each<{
    name: string;
    args: Parameters<typeof findStatusEffectPool>;
    expected: ReturnType<typeof findStatusEffectPool>;
  }>([
    {
      name: "枠・向き・種類がすべて一致するまとまりを返す",
      args: [state, "battleAbility", "debuff", physicalAttack],
      expected: createPool({
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [violaAntiAttack2],
      }),
    },
    {
      name: "向きが違えば別のまとまりを返す",
      args: [state, "battleAbility", "buff", physicalAttack],
      expected: createPool({
        polarity: "buff",
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [sourceA],
      }),
    },
    {
      name: "枠が違えば別のまとまりを返す",
      args: [state, "ultimate", "debuff", physicalAttack],
      expected: createPool({
        slot: "ultimate",
        timedMagnitude: 20,
        remainingTurns: 2,
        timedSources: [sourceB],
      }),
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
        "debuff",
        physicalAttack,
      ],
      expected: 15,
    },
    {
      name: "ターン無し効果の効果量を返す",
      args: [
        applyAll([createApplication({ magnitude: 10, duration: permanent })]),
        "battleAbility",
        "debuff",
        physicalAttack,
      ],
      expected: 10,
    },
    {
      name: "同じ枠のターン無し 10% とターン付き 15% は合算して 25% になる",
      args: [
        applyAll([
          createApplication({
            slot: "supportAbility",
            polarity: "buff",
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            slot: "supportAbility",
            polarity: "buff",
            magnitude: 15,
            duration: turns(3),
            source: timedSource1,
          }),
        ]),
        "supportAbility",
        "buff",
        physicalAttack,
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
        "debuff",
        physicalAttack,
      ],
      expected: 30,
    },
    {
      name: "上限を 50% にすると 30% を超えた分も反映される",
      args: [
        applyAll([
          createApplication({ magnitude: 30 }),
          createApplication({ magnitude: 25, source: sourceA }),
        ]),
        "battleAbility",
        "debuff",
        physicalAttack,
        { magnitudeCap: 50 },
      ],
      expected: 50,
    },
    {
      name: "かかっていなければ 0",
      args: [
        applyAll([createApplication()]),
        "supportAbility",
        "debuff",
        physicalAttack,
      ],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusEffectMagnitude(...args)).toBe(expected);
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
        "debuff",
        physicalAttack,
      ],
      expected: 3,
    },
    {
      name: "ターン無し効果だけなら 0",
      args: [
        applyAll([createApplication({ duration: permanent })]),
        "battleAbility",
        "debuff",
        physicalAttack,
      ],
      expected: 0,
    },
    {
      name: "かかっていなければ 0",
      args: [
        applyAll([createApplication()]),
        "battleAbility",
        "buff",
        physicalAttack,
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
      expected: StatusEffectState;
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
            kind: physicalDefense,
            magnitude: 15,
            source: { characterId: "cress", abilityId: "backstab" },
          }),
          createApplication({
            kind: physicalDefense,
            magnitude: 15,
            source: { characterId: "duran", abilityId: "backstab" },
          }),
        ],
        expected: [
          createPool({
            kind: physicalDefense,
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
            polarity: "buff",
            source: { characterId: "lynette", abilityId: "tatsujinNoKobu3" },
          }),
          createApplication({
            slot: "ultimate",
            polarity: "buff",
            duration: turns(3),
            source: { characterId: "primrose", abilityId: "ultimate" },
          }),
        ],
        expected: [
          createPool({
            polarity: "buff",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [
              { characterId: "lynette", abilityId: "tatsujinNoKobu3" },
            ],
          }),
          createPool({
            slot: "ultimate",
            polarity: "buff",
            timedMagnitude: 20,
            remainingTurns: 3,
            timedSources: [{ characterId: "primrose", abilityId: "ultimate" }],
          }),
        ],
      },
      {
        name: "同じ枠でも種類が違えば別々に管理される（物攻ダウンと属攻ダウン）",
        applications: [
          createApplication({ kind: physicalAttack }),
          createApplication({ kind: elementalAttack }),
        ],
        expected: [
          createPool({
            kind: physicalAttack,
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [violaAntiAttack2],
          }),
          createPool({
            kind: elementalAttack,
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [violaAntiAttack2],
          }),
        ],
      },
      {
        name: "同じ種類でもバフとデバフは別々に管理される（相殺しない）",
        applications: [
          createApplication({ polarity: "buff", source: sourceA }),
          createApplication({ polarity: "debuff", source: sourceB }),
        ],
        expected: [
          createPool({
            polarity: "buff",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [sourceA],
          }),
          createPool({
            polarity: "debuff",
            timedMagnitude: 20,
            remainingTurns: 2,
            timedSources: [sourceB],
          }),
        ],
      },
    ])("$name", ({ applications, expected }) => {
      expect(applyAll(applications)).toStrictEqual(expected);
    });
  });

  describe("ターン無し効果", () => {
    test.each<{
      name: string;
      applications: StatusEffectApplication[];
      expected: StatusEffectState;
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
      expect(applyAll(applications)).toStrictEqual(expected);
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
      expect(() => applyStatusEffect([], application)).toThrow(expected);
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
      expected: [
        createPool({
          permanentSources: [{ source: permanentSource2, magnitude: 5 }],
        }),
      ],
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
      expected: [
        createPool({
          timedMagnitude: 20,
          remainingTurns: 2,
          timedSources: [timedSource1],
        }),
      ],
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
      expected: [],
    },
    {
      name: "複数の種類にまたがる同じ付与元をまとめて取り除く",
      args: [
        applyAll([
          createApplication({
            kind: physicalAttack,
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
          createApplication({
            kind: elementalAttack,
            magnitude: 10,
            duration: permanent,
            source: permanentSource1,
          }),
        ]),
        permanentSource1,
      ],
      expected: [],
    },
    {
      name: "該当する付与元が無ければ変化しない",
      args: [
        applyAll([createApplication({ source: timedSource1 })]),
        permanentSource1,
      ],
      expected: [
        createPool({
          timedMagnitude: 20,
          remainingTurns: 2,
          timedSources: [timedSource1],
        }),
      ],
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
      expected: [
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
      ],
    },
    {
      name: "残りターンが 1 で他に何も無いまとまりは取り除かれる",
      args: [applyAll([createApplication({ duration: turns(1) })])],
      expected: [],
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
      expected: [
        createPool({
          permanentSources: [{ source: permanentSource1, magnitude: 10 }],
        }),
      ],
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
      expected: [
        createPool({
          permanentSources: [{ source: permanentSource1, magnitude: 10 }],
        }),
      ],
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
    const before = applyAll([createApplication()]);
    const snapshot = structuredClone(before);
    elapseStatusEffectTurn(before);
    expect(before).toStrictEqual(snapshot);
  });
});

describe("ターンをまたいだシナリオ", () => {
  const readBattleAbilityBuff = (state: StatusEffectState) => ({
    magnitude: getStatusEffectMagnitude(
      state,
      "battleAbility",
      "buff",
      physicalAttack,
    ),
    remainingTurns: getStatusEffectRemainingTurns(
      state,
      "battleAbility",
      "buff",
      physicalAttack,
    ),
  });

  it("1 ターン目に 10%（2 ターン）、2 ターン目に別技で 20%（2 ターン）を付与すると、2〜4 ターン目は 30% になる", () => {
    // 1 ターン目
    let state = applyStatusEffect(
      [],
      createApplication({ polarity: "buff", magnitude: 10, source: sourceA }),
    );
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 10,
      remainingTurns: 2,
    });
    state = elapseStatusEffectTurn(state);

    // 2 ターン目: 残り 1 ターンに 2 ターン分が足されて 3 ターンになる
    state = applyStatusEffect(
      state,
      createApplication({ polarity: "buff", magnitude: 20, source: sourceB }),
    );
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 3,
    });
    state = elapseStatusEffectTurn(state);

    // 3 ターン目
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 2,
    });
    state = elapseStatusEffectTurn(state);

    // 4 ターン目: 効果量は切れる直前まで 30% のまま
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 1,
    });
    state = elapseStatusEffectTurn(state);

    // 5 ターン目: 消えている
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 0,
      remainingTurns: 0,
    });
  });

  it("切れる前にどちらの技で延長しても 30% が維持される", () => {
    let state = applyAll([
      createApplication({ polarity: "buff", magnitude: 10, source: sourceA }),
      createApplication({ polarity: "buff", magnitude: 20, source: sourceB }),
    ]);
    state = elapseStatusEffectTurn(state);
    state = elapseStatusEffectTurn(state);
    state = elapseStatusEffectTurn(state);
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 1,
    });

    state = applyStatusEffect(
      state,
      createApplication({ polarity: "buff", magnitude: 10, source: sourceA }),
    );
    expect(readBattleAbilityBuff(state)).toStrictEqual({
      magnitude: 30,
      remainingTurns: 3,
    });
  });

  it("サポアビ枠のターン無し 10% とターン付き 15% は合わせて 25% になり、ターン付きが切れると 10% に戻る", () => {
    const read = (state: StatusEffectState) =>
      getStatusEffectMagnitude(state, "supportAbility", "buff", physicalAttack);

    let state = applyAll([
      createApplication({
        slot: "supportAbility",
        polarity: "buff",
        magnitude: 10,
        duration: permanent,
        source: permanentSource1,
      }),
      createApplication({
        slot: "supportAbility",
        polarity: "buff",
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
    expect(state).toStrictEqual([]);
  });
});
