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
// - キャラクター固有のアビリティは `<キャラクター ID>:<アビリティ名>` にする
//   （例: `scholar:ryukku:chougouburasutaamain`）。同名のアビリティでもキャラクターが違えば別物で、
//   ID はデータ種別の中で一意にする必要があるため
// - 複数のキャラクターが共有するアビリティは `<アビリティ名>` だけにする
// - `<アビリティ名>` は、ゲーム内の日本語のアビリティ名の読みをヘボン式ローマ字にしたもの。
//   英訳は使わない。英訳は人によって結果が変わり、名前から機械的に導けないため
// - すべて小文字で、切れ目なしに綴る。単語の切れ目で大文字にしない
// - 「灯火」「ＥＸ」は含めない。アビリティ名の一部ではなく、含めなくても一意になるため
//   （例: 魅惑の誘い 灯火 → `dancer:shichieiyuurokkubuuke:miwakunoizanai`）
// - 1 キャラクター × データ種別の中で綴りが衝突した場合は、個別に区別する語を足し、
//   その理由をデータ定義にコメントで書く
// - ID は表示に使わない識別子なので、読みの正確さより、一意で安定していることを優先する。
//   読みを決めた後で別の読みが正しいと分かっても、ID を必ず改名する必要はない
//
// ローマ字表記の基本の規約は、キャラクター ID の `<キャラクター名>` の規約
// （lib/data/characters/index.ts）に従う。以下はアビリティ名に固有の規約。
//
//   「：」「・」「！」、空白  取り除いて前後を続けて綴る（調合：バオール `chougoubaooru` /
//                             ロサ・プロセラ `rosapurosera`）
//   括弧                      括弧だけ取り除き、中身は読みを続けて綴る。省かない
//                             （大氷結魔法（単体）II `daihyouketsumahoutantai2`）
//   「＆」                    読み「アンド」で綴る（チャージ＆アサルト `chaajiandoasaruto`）
//   末尾のランク              ローマ数字は算用数字にする。文字の種類（`Ⅱ` / `II`）は問わない
//                             （赤心のヴェールV `sekishinnoveeru5`）
//   ラテン文字                そのまま小文字にする。読みをローマ字にしない
//                             （ジェクトOVERDRIVE！ `jekutooverdrive`）
//   算用数字                  そのまま残す（調合：カルテット99 `chougoukarutetto99`）
//   漢字                      ゲーム内・公式の読みが確認できればそれを使う。確認できないときは、
//                             辞書にある語は辞書の読み、送り仮名がある語は訓読み、それ以外の
//                             造語は音読みを使う。迷った読みはデータ定義にコメントで書く
//                             （恒河沙 `gougasha` / 熾限 `shigen`）
//   資料の誤字                ゲーム内の名前に直してから綴る（ニ連斬 → 二連斬 `nirenzan`）
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
