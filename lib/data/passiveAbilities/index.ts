//
// パッシブアビリティデータ定義のガイドライン
//
// パッシブアビリティは、行動を消費せず自動で効く（または常時掛かる）アビリティ
// （現時点ではサポートアビリティのみ。今後、ベーシックアビリティ・灯火の加護・
// 灯火の加護強化ボーナスを追加する）。アクティブアビリティは
// lib/data/activeAbilities/ に置き、ここには混ぜない。
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
// 複数のキャラクターが共有するアビリティを追加するときは、ジョブ別とは別の分割ファイルを作る。
// データが増えた段階で分割の単位は見直してよい。
//
// ## ID の命名規則
//
// lib/data/activeAbilities/ と共通の規則で、本体は lib/data/activeAbilities/index.ts に書く。
// ID の一意性はデータ種別の中で保証する（例: `scholar:ryukku:arubedozokuchounomusume`）。
//
// ## プロパティの記述順
//
// データ定義側ではアルファベット順ではなく、以下の固有順で並べる。
// （型定義側 PassiveAbilityDataDef は ASCII 順なので順序が異なる）
//
//   1. id
//   2. name
//   3. category
//
// ## エントリの並び順
//
// 分割ファイルの中ではキャラクター ID の ASCII 順にまとめ、キャラクターの中では
// ゲーム内の表示順に合わせる。
//

import { createDataDict } from "@/lib/dataDefinitionUtils";
import type {
  DataId,
  PassiveAbilityData,
  PassiveAbilityDataDef,
} from "@/lib/types";

import {
  type DancerPassiveAbilityDataId,
  dancerPassiveAbilitiesJson,
} from "./dancers";
import {
  type ScholarPassiveAbilityDataId,
  scholarPassiveAbilitiesJson,
} from "./scholars";

export type PassiveAbilityDataId =
  DancerPassiveAbilityDataId | ScholarPassiveAbilityDataId;

export const passiveAbilitiesJson = [
  ...dancerPassiveAbilitiesJson,
  ...scholarPassiveAbilitiesJson,
];

const resolvePassiveAbilityData = (
  def: PassiveAbilityDataDef,
): PassiveAbilityData => ({
  ...def,
});

export const passiveAbilityDataList: ReadonlyArray<PassiveAbilityData> =
  passiveAbilitiesJson.map(resolvePassiveAbilityData);

export const passiveAbilityDataDict = createDataDict<
  DataId,
  PassiveAbilityData
>(passiveAbilityDataList, "id");

export const isPassiveAbilityDataId = (
  value: string,
): value is PassiveAbilityDataId =>
  Object.hasOwn(passiveAbilityDataDict, value);
