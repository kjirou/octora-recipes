//
// キャラクターデータ定義のガイドライン
//
// ## 収録範囲
//
// 現時点のデータは仕組みの検証用の一部のみで、網羅していない。
// activeAbilityDataIds / passiveAbilityDataIds も、そのキャラクターが持つ全アビリティではない。
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
// - `<ジョブ>:<キャラクター名>` の形にする（例: `scholar:kazan`）。同じキャラクター像が
//   複数のジョブで別々のキャラクターとして実装されている場合があり、ジョブで区別するため
//   （例: ヴィオラの 3 キャラクターは `thief:viora` / `scholar:viora` / `warrior:viora`）
// - `<ジョブ>` は Job 型の値で、そのキャラクターの job プロパティと一致させる
// - `<キャラクター名>` は、ゲーム内の日本語のキャラクター名の読みをヘボン式ローマ字にしたもの。
//   英語名は使わない。攻略サイトなどで使われる「EX」は、ゲーム内のキャラクター名に含まれず、
//   ジョブで区別できるため含めない
// - 漢字の部分も読みをローマ字にして切れ目なしに含める。称号も省かない
//   （例: 七英雄ロックブーケ → `dancer:shichieiyuurokkubuuke`）
// - ジョブと名前が同じで ID が衝突した場合は、個別に区別する語を足し、その理由をデータ定義に
//   コメントで書く
//
// `<キャラクター名>` のローマ字表記の規約。名前から機械的に導けて、別の名前が同じ綴りに
// なりにくいことを優先する。
//
//   基本・拗音      ヘボン式で綴る（し `shi` / ち `chi` / つ `tsu` / ふ `fu` / じ `ji` /
//                   しゃ `sha` / ちゅ `chu` / じょ `jo` / りゅ `ryu`）
//   長音            省略せず、仮名のとおりに綴る。「ー」は直前の母音を重ねる。マクロン（`ō`）や
//                   `h` は使わない（ブーケ `buuke` / えいゆう `eiyuu` / こうてい `koutei`）
//   促音            次の子音字を重ねる。`ch` の前は `t`（リュック `ryukku` / ルッソ `russo` /
//                   マッチ `matchi`）
//   撥音            常に `n`。`b` `m` `p` の前でも `m` にしない。母音・や行の前でも区切り記号を
//                   入れない（カザン `kazan` / リンユウ `rinyuu`）
//   助詞            発音どおりに綴る（は `wa` / へ `e` / を `o`）
//   外来語の仮名    仮名の組み合わせを素直に綴る（ヴァ `va` / ヴィ `vi` / ファ `fa` / ティ `ti` /
//                   ディ `di` / ウィ `wi` / シェ `she` / チェ `che` / ジェ `je`）
//   漢字            ゲーム内・公式の読みをローマ字にする。読みが確認できないときは一般的な読みを
//                   使い、データ定義にコメントで読みを書く（七英雄 `shichieiyuu`）
//   記号・空白      「・」、空白、括弧などは取り除き、括弧の中身は前後と続けて綴る
//                   （最終皇帝(女) `saishuukouteionna`）
//   大文字・小文字  すべて小文字。単語の切れ目で大文字にしない
//
// ## プロパティの記述順
//
// データ定義側ではアルファベット順ではなく、以下の固有順で並べる。
// （型定義側 CharacterDataDef は ASCII 順なので順序が異なる）
//
//   1. id
//   2. name
//   3. job
//   4. influence
//   5. rarity
//   6. activeAbilityDataIds    -- 並び順は lib/data/activeAbilities/index.ts のエントリの並び順に合わせる
//   7. passiveAbilityDataIds   -- 並び順は lib/data/passiveAbilities/index.ts のエントリの並び順に合わせる
//
// グルーピングの意図:
//   - 識別:  id / name
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
});

export const characterDataList: ReadonlyArray<CharacterData> =
  charactersJson.map(resolveCharacterData);

export const characterDataDict = createDataDict<DataId, CharacterData>(
  characterDataList,
  "id",
);

export const isCharacterDataId = (value: string): value is CharacterDataId =>
  Object.hasOwn(characterDataDict, value);
