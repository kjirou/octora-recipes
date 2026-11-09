//
// アクティブアビリティデータ定義のガイドライン
//
// アクティブアビリティは、プレイヤーが行動として選択して使うアビリティ
// （バトルアビリティ / EX アビリティ / 必殺技）。パッシブアビリティは
// lib/data/passiveAbilities/ に置き、ここには混ぜない。
//
// ## 収録範囲
//
// 現時点のデータは仕組みの検証用の一部のみで、網羅していない。
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
// lib/data/passiveAbilities/ と共通の規則。ID の一意性はデータ種別の中で保証する。
//
// - lower camel case で書く
// - キャラクター固有のアビリティは `<キャラクター ID>:<アビリティ名>` にする
//   （例: `lueck:mixBlasterMine`）。同名のアビリティでもキャラクターが違えば別物で、
//   ID はデータ種別の中で一意にする必要があるため
// - アビリティ名の部分は英訳が分かればその英訳、分からなければ日本語のローマ字にする
//   （例: `kazan:ikkon`）
// - 「調合：」のような接頭辞は英訳して含める（例: `lueck:mixBlasterMine`）
// - 「灯火」などの強化版は別のアビリティとして扱い、ID の末尾に付ける
//   （例: `rocbouquet:alluringInvitationTomoshibi`）
//
// ## プロパティの記述順
//
// データ定義側ではアルファベット順ではなく、以下の固有順で並べる。
// （型定義側 ActiveAbilityDataDef は ASCII 順なので順序が異なる）
//
//   1. id
//   2. name
//   3. category
//
// ## エントリの並び順
//
// 分割ファイルの中ではキャラクター ID の ASCII 順にまとめ、キャラクターの中では
// バトルアビリティ → EX アビリティ → 必殺技 の順に並べる。
// 同じ種類の中ではゲーム内の表示順に合わせる。
//

import { createDataDict } from "@/lib/dataDefinitionUtils";
import type {
  ActiveAbilityData,
  ActiveAbilityDataDef,
  DataId,
} from "@/lib/types";

import {
  type DancerActiveAbilityDataId,
  dancerActiveAbilitiesJson,
} from "./dancers";
import {
  type ScholarActiveAbilityDataId,
  scholarActiveAbilitiesJson,
} from "./scholars";

export type ActiveAbilityDataId =
  DancerActiveAbilityDataId | ScholarActiveAbilityDataId;

export const activeAbilitiesJson = [
  ...dancerActiveAbilitiesJson,
  ...scholarActiveAbilitiesJson,
];

const resolveActiveAbilityData = (
  def: ActiveAbilityDataDef,
): ActiveAbilityData => ({
  ...def,
});

export const activeAbilityDataList: ReadonlyArray<ActiveAbilityData> =
  activeAbilitiesJson.map(resolveActiveAbilityData);

export const activeAbilityDataDict = createDataDict<DataId, ActiveAbilityData>(
  activeAbilityDataList,
  "id",
);

export const isActiveAbilityDataId = (
  value: string,
): value is ActiveAbilityDataId => Object.hasOwn(activeAbilityDataDict, value);
