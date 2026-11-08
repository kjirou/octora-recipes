/**
 * 状態異常の種別のマスターデータ。
 *
 * 種別ごとに日本語の表示名と、敵にのみ付与されるかを定義する。
 * 付与・継続・解除のロジックは未実装で、ここでは名称とゲーム内の表現の紐づけだけを持つ。
 * 種別を追加するときは lib/types.ts の StatusAilmentKind と、ここの定義の両方に加える。
 */

import type {
  StatusAilmentKind,
  StatusAilmentKindDefinition,
} from "@/lib/types";

export const STATUS_AILMENT_KIND_DEFINITIONS: Record<
  StatusAilmentKind,
  StatusAilmentKindDefinition
> = {
  bleeding: { kind: "bleeding", name: "出血", enemyOnly: false },
  blindness: { kind: "blindness", name: "暗闇", enemyOnly: false },
  burning: { kind: "burning", name: "燃焼", enemyOnly: true },
  charm: { kind: "charm", name: "魅惑", enemyOnly: false },
  corrosion: { kind: "corrosion", name: "腐蝕", enemyOnly: false },
  dizziness: { kind: "dizziness", name: "眩暈", enemyOnly: false },
  electrification: { kind: "electrification", name: "感電", enemyOnly: true },
  fear: { kind: "fear", name: "恐怖", enemyOnly: false },
  frostbite: { kind: "frostbite", name: "凍傷", enemyOnly: true },
  heavyBleeding: { kind: "heavyBleeding", name: "大出血", enemyOnly: false },
  painRage: { kind: "painRage", name: "ペインレイジ", enemyOnly: true },
  paralysis: { kind: "paralysis", name: "麻痺", enemyOnly: false },
  poison: { kind: "poison", name: "毒", enemyOnly: false },
  provocation: { kind: "provocation", name: "挑発", enemyOnly: true },
  saintHalo: { kind: "saintHalo", name: "セントヘイロー", enemyOnly: true },
  severePoison: { kind: "severePoison", name: "猛毒", enemyOnly: false },
  silence: { kind: "silence", name: "沈黙", enemyOnly: false },
  sleep: { kind: "sleep", name: "睡眠", enemyOnly: false },
  spContamination: {
    kind: "spContamination",
    name: "SP汚染",
    enemyOnly: false,
  },
  weakness: { kind: "weakness", name: "衰弱", enemyOnly: false },
};

/** すべての種別を定義順（ASCII 順）で返す。 */
export const listStatusAilmentKinds = (): StatusAilmentKind[] =>
  Object.keys(STATUS_AILMENT_KIND_DEFINITIONS) as StatusAilmentKind[];

/** 種別のマスターデータを返す。 */
export const getStatusAilmentKindDefinition = (
  kind: StatusAilmentKind,
): StatusAilmentKindDefinition => STATUS_AILMENT_KIND_DEFINITIONS[kind];
