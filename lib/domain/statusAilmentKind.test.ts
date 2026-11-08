import { describe, expect, it, test } from "vitest";

import {
  STATUS_AILMENT_KIND_DEFINITIONS,
  getStatusAilmentKindDefinition,
  listStatusAilmentKinds,
} from "./statusAilmentKind";

describe("STATUS_AILMENT_KIND_DEFINITIONS", () => {
  it("キーと定義内の kind が一致している", () => {
    for (const [key, definition] of Object.entries(
      STATUS_AILMENT_KIND_DEFINITIONS,
    )) {
      expect(definition.kind).toBe(key);
    }
  });

  it("表示名が重複していない", () => {
    const names = Object.values(STATUS_AILMENT_KIND_DEFINITIONS).map(
      (definition) => definition.name,
    );
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("listStatusAilmentKinds", () => {
  it("すべての種別を ASCII 順で返す", () => {
    const kinds = listStatusAilmentKinds();
    expect(kinds).toStrictEqual([...kinds].sort());
    expect(kinds).toHaveLength(20);
  });
});

describe("getStatusAilmentKindDefinition", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getStatusAilmentKindDefinition>;
    expected: ReturnType<typeof getStatusAilmentKindDefinition>;
  }>([
    {
      name: "麻痺の定義を返す",
      args: ["paralysis"],
      expected: { kind: "paralysis", name: "麻痺", enemyOnly: false },
    },
    {
      name: "敵にのみ付与される燃焼の定義を返す",
      args: ["burning"],
      expected: { kind: "burning", name: "燃焼", enemyOnly: true },
    },
  ])("$name", ({ args, expected }) => {
    expect(getStatusAilmentKindDefinition(...args)).toStrictEqual(expected);
  });
});
