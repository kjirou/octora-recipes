//
// アビリティデータ定義のガイドライン
//
// ## 分割ファイルの単位
//
// アビリティを持つキャラクターのジョブごとに分割する（lib/data/characters/ と同じ単位）。
// ファイル名はジョブの複数形にする。
//
//   dancers.ts    -- 踊子
//   scholars.ts   -- 学者
//
// 複数のキャラクターが共有するアビリティ（たたかう、支援者・援魔石など）を追加するときは、
// ジョブ別とは別の分割ファイルを作る。データが増えた段階で分割の単位は見直してよい。
//
// ## ID の命名規則
//
// - lower camel case で書く
// - キャラクター固有のアビリティは `<キャラクター ID>:<アビリティ名>` にする
//   （例: `lueck:albedoChieftainsDaughter`）。同名のアビリティでもキャラクターが違えば別物で、
//   ID は全アビリティで一意にする必要があるため
// - アビリティ名の部分は英訳が分かればその英訳、分からなければ日本語のローマ字にする
//   （例: `kazan:ikkon`）
// - 「調合：」のような接頭辞は英訳して含める（例: `lueck:mixBlasterMine`）
// - 「灯火」などの強化版は別のアビリティとして扱い、ID の末尾に付ける
//   （例: `rocbouquet:alluringInvitationTomoshibi`）
//
// ## プロパティの記述順
//
// データ定義側ではアルファベット順ではなく、以下の固有順で並べる。
// （型定義側 AbilityDataDef は ASCII 順なので順序が異なる）
//
//   1. id
//   2. name
//   3. category
//
// ## エントリの並び順
//
// 分割ファイルの中ではキャラクター ID の ASCII 順にまとめ、キャラクターの中では
// バトルアビリティ → EX アビリティ → サポートアビリティ → 必殺技 の順に並べる。
// 同じ種類の中ではゲーム内の表示順に合わせる。
//

import { createDataDict } from "@/lib/dataDefinitionUtils";
import type { AbilityData, AbilityDataDef, DataId } from "@/lib/types";

import { type DancerAbilityDataId, dancerAbilitiesJson } from "./dancers";
import { type ScholarAbilityDataId, scholarAbilitiesJson } from "./scholars";

export type AbilityDataId = DancerAbilityDataId | ScholarAbilityDataId;

export const abilitiesJson = [...dancerAbilitiesJson, ...scholarAbilitiesJson];

const resolveAbilityData = (def: AbilityDataDef): AbilityData => ({
  ...def,
});

export const abilityDataList: ReadonlyArray<AbilityData> =
  abilitiesJson.map(resolveAbilityData);

export const abilityDataDict = createDataDict<DataId, AbilityData>(
  abilityDataList,
  "id",
);

export const isAbilityDataId = (value: string): value is AbilityDataId =>
  Object.hasOwn(abilityDataDict, value);
