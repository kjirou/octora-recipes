/**
 * ステータス効果の種別のマスターデータ。
 *
 * 種別ごとに、バフかデバフか（向き）と日本語の表示名を定義する。
 * 種別を追加するときは lib/types.ts の StatusEffectKind と、ここの定義の両方に加える
 * （Record 型なので、片方だけ加えると型エラーになる）。
 */

import type {
  StatusEffectKind,
  StatusEffectKindDefinition,
  StatusEffectPolarity,
} from "@/lib/types";

export const STATUS_EFFECT_KIND_DEFINITIONS: Record<
  StatusEffectKind,
  StatusEffectKindDefinition
> = {
  criticalRateDown: {
    kind: "criticalRateDown",
    name: "会心ダウン",
    polarity: "debuff",
  },
  criticalRateUp: {
    kind: "criticalRateUp",
    name: "会心アップ",
    polarity: "buff",
  },
  elementalAttackDown: {
    kind: "elementalAttackDown",
    name: "属攻ダウン",
    polarity: "debuff",
  },
  elementalAttackUp: {
    kind: "elementalAttackUp",
    name: "属攻アップ",
    polarity: "buff",
  },
  elementalDefenseDown: {
    kind: "elementalDefenseDown",
    name: "属防ダウン",
    polarity: "debuff",
  },
  elementalDefenseUp: {
    kind: "elementalDefenseUp",
    name: "属防アップ",
    polarity: "buff",
  },
  physicalAttackDown: {
    kind: "physicalAttackDown",
    name: "物攻ダウン",
    polarity: "debuff",
  },
  physicalAttackUp: {
    kind: "physicalAttackUp",
    name: "物攻アップ",
    polarity: "buff",
  },
  physicalDefenseDown: {
    kind: "physicalDefenseDown",
    name: "物防ダウン",
    polarity: "debuff",
  },
  physicalDefenseUp: {
    kind: "physicalDefenseUp",
    name: "物防アップ",
    polarity: "buff",
  },
  speedDown: {
    kind: "speedDown",
    name: "速度ダウン",
    polarity: "debuff",
  },
  speedUp: {
    kind: "speedUp",
    name: "速度アップ",
    polarity: "buff",
  },
};

/** すべての種別を定義順（ASCII 順）で返す。 */
export const listStatusEffectKinds = (): StatusEffectKind[] =>
  Object.keys(STATUS_EFFECT_KIND_DEFINITIONS) as StatusEffectKind[];

/** 種別のマスターデータを返す。 */
export const getStatusEffectKindDefinition = (
  kind: StatusEffectKind,
): StatusEffectKindDefinition => STATUS_EFFECT_KIND_DEFINITIONS[kind];

/** 種別がバフかデバフかを返す。 */
export const getStatusEffectPolarity = (
  kind: StatusEffectKind,
): StatusEffectPolarity => STATUS_EFFECT_KIND_DEFINITIONS[kind].polarity;
