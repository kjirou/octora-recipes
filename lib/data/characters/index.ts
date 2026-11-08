//
// キャラクターデータ定義のガイドライン
//
// ## 分割ファイルの単位
//
// ジョブごとに分割する。ファイル名はジョブの複数形にする。
//
//   dancers.ts    -- 踊子
//   scholars.ts   -- 学者
//
// データが増えた段階で分割の単位は見直してよい。
//
// ## ID の命名規則
//
// - lower camel case で書く
// - 英語名が分かればその英語名、分からなければ日本語のローマ字にする
//   （例: `rocbouquet`, `kazan`）。称号（「七英雄」など）は含めない
// - EX 版など同名の別キャラクターは末尾で区別する（例: `osvaldEx`）
//
// ## プロパティの記述順
//
// データ定義側ではアルファベット順ではなく、以下の固有順で並べる。
// （型定義側 CharacterDataDef は ASCII 順なので順序が異なる）
//
//   1. id
//   2. name
//   3. englishName
//   4. job
//   5. influence
//   6. rarity
//   7. activeAbilityDataIds    -- 並び順は lib/data/activeAbilities/index.ts のエントリの並び順に合わせる
//   8. passiveAbilityDataIds   -- 並び順は lib/data/passiveAbilities/index.ts のエントリの並び順に合わせる
//
// グルーピングの意図:
//   - 識別:  id / name / englishName
//   - 分類:  job / influence / rarity
//   - 能力:  activeAbilityDataIds / passiveAbilityDataIds
//
// ## エントリの並び順
//
// 分割ファイルの中では id の ASCII 順に並べる。
//

import { createDataDict } from "@/lib/dataDefinitionUtils";
import type { CharacterData, CharacterDataDef, DataId } from "@/lib/types";

import { type DancerCharacterDataId, dancerCharactersJson } from "./dancers";
import { type ScholarCharacterDataId, scholarCharactersJson } from "./scholars";

export type CharacterDataId = DancerCharacterDataId | ScholarCharacterDataId;

export const charactersJson = [
  ...dancerCharactersJson,
  ...scholarCharactersJson,
];

const resolveCharacterData = (def: CharacterDataDef): CharacterData => ({
  ...def,
  englishName: def.englishName ?? null,
});

export const characterDataList: ReadonlyArray<CharacterData> =
  charactersJson.map(resolveCharacterData);

export const characterDataDict = createDataDict<DataId, CharacterData>(
  characterDataList,
  "id",
);

export const isCharacterDataId = (value: string): value is CharacterDataId =>
  Object.hasOwn(characterDataDict, value);
