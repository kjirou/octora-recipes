import { describe, expect, it, test } from "vitest";

import { activeAbilityDataDict } from "../activeAbilities";
import { passiveAbilityDataDict } from "../passiveAbilities";
import { findDuplicateIds } from "../testHelper";

import { characterDataList, isCharacterDataId } from ".";

describe("characterDataList", () => {
  it("キャラクターの id が重複していない", () => {
    expect(findDuplicateIds(characterDataList)).toStrictEqual([]);
  });

  describe("id", () => {
    test.each(characterDataList)("$id は命名規則に従う", (character) => {
      expect(character.id).toMatch(/^[a-z][a-zA-Z0-9]*$/);
    });
  });

  describe("データのリレーション", () => {
    test.each(characterDataList)("$id", (character) => {
      for (const id of character.activeAbilityDataIds) {
        expect(activeAbilityDataDict).toHaveProperty([id]);
      }
      for (const id of character.passiveAbilityDataIds) {
        expect(passiveAbilityDataDict).toHaveProperty([id]);
      }
    });
  });

  describe.each([
    {
      property: "activeAbilityDataIds",
      getIds: (character: (typeof characterDataList)[number]) =>
        character.activeAbilityDataIds,
    },
    {
      property: "passiveAbilityDataIds",
      getIds: (character: (typeof characterDataList)[number]) =>
        character.passiveAbilityDataIds,
    },
  ])("$property", ({ getIds }) => {
    test.each(characterDataList)(
      "$id は同じアビリティを重複して持たない",
      (character) => {
        expect(
          findDuplicateIds(getIds(character).map((id) => ({ id }))),
        ).toStrictEqual([]);
      },
    );

    test.each(characterDataList)(
      "$id のキャラクター固有のアビリティの ID は自身の ID を接頭辞に持つ",
      (character) => {
        const prefixes = getIds(character)
          .filter((id) => id.includes(":"))
          .map((id) => id.split(":")[0]);
        for (const prefix of prefixes) {
          expect(prefix).toBe(character.id);
        }
      },
    );
  });
});

describe("isCharacterDataId", () => {
  test.each<{
    name: string;
    args: Parameters<typeof isCharacterDataId>;
    expected: ReturnType<typeof isCharacterDataId>;
  }>([
    {
      name: "定義されている ID なら true を返す",
      args: ["lueck"],
      expected: true,
    },
    {
      name: "定義されていない ID なら false を返す",
      args: ["unknown"],
      expected: false,
    },
    {
      name: "Object のプロトタイプのプロパティ名なら false を返す",
      args: ["toString"],
      expected: false,
    },
  ])("$name", ({ args, expected }) => {
    expect(isCharacterDataId(...args)).toBe(expected);
  });
});
