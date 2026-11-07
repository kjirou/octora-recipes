import { describe, expect, it, test } from "vitest";

import { calculateBpAtNextTurnStart, canBoost, getBoostBpCost } from "./boost";

describe("getBoostBpCost", () => {
  test.each<{
    name: string;
    args: Parameters<typeof getBoostBpCost>;
    expected: ReturnType<typeof getBoostBpCost>;
  }>([
    { name: "ブーストなしは BP を消費しない", args: [0], expected: 0 },
    { name: "×2 は BP を 1 消費する", args: [1], expected: 1 },
    { name: "×3 は BP を 2 消費する", args: [2], expected: 2 },
    { name: "MAX は BP を 3 消費する", args: [3], expected: 3 },
  ])("$name", ({ args, expected }) => {
    expect(getBoostBpCost(...args)).toBe(expected);
  });
});

describe("canBoost", () => {
  test.each<{
    name: string;
    args: Parameters<typeof canBoost>;
    expected: ReturnType<typeof canBoost>;
  }>([
    { name: "BP が 0 でもブーストなしは選べる", args: [0, 0], expected: true },
    { name: "BP が 0 なら ×2 は選べない", args: [0, 1], expected: false },
    { name: "BP が消費量と同じなら選べる", args: [3, 3], expected: true },
    { name: "BP が消費量より多ければ選べる", args: [5, 3], expected: true },
    {
      name: "BP が消費量より少なければ選べない",
      args: [2, 3],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(canBoost(...args)).toBe(expected);
  });
});

describe("calculateBpAtNextTurnStart", () => {
  test.each<{
    name: string;
    args: Parameters<typeof calculateBpAtNextTurnStart>;
    expected: ReturnType<typeof calculateBpAtNextTurnStart>;
  }>([
    {
      name: "ブーストしなければ次ターンに 1 回復する",
      args: [2, 0],
      expected: 3,
    },
    {
      name: "ブーストしなくても上限 5 を超えて回復しない",
      args: [5, 0],
      expected: 5,
    },
    {
      name: "×2 でブーストすると 1 減り、次ターンは回復しない",
      args: [3, 1],
      expected: 2,
    },
    {
      name: "MAX でブーストすると 3 減り、次ターンは回復しない",
      args: [5, 3],
      expected: 2,
    },
    {
      name: "BP をちょうど使い切ると次ターンは 0 になる",
      args: [3, 3],
      expected: 0,
    },
  ])("$name", ({ args, expected }) => {
    expect(calculateBpAtNextTurnStart(...args)).toBe(expected);
  });

  it("BP が不足しているブースト段階を指定すると例外を投げる", () => {
    expect(() => calculateBpAtNextTurnStart(1, 2)).toThrow(
      "BP が不足しています",
    );
  });
});
