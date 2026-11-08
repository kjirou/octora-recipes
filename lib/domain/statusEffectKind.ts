/**
 * ステータス効果の種別のマスターデータ。
 *
 * 種別ごとに、バフかデバフか（向き）と日本語の表示名を定義する。
 * ダメージアップ系の種別には、攻撃時の合算に使う属性（掛かる攻撃種別と発動条件）も定義する。
 * 種別を追加するときは lib/types.ts の StatusEffectKind と、ここの定義の両方に加える
 * （Record 型なので、片方だけ加えると型エラーになる）。ダメージアップ系の種別は、
 * lib/types.ts の DamageUpStatusEffectKind・STATUS_EFFECT_KIND_DEFINITIONS・
 * DAMAGE_UP_KIND_DEFINITIONS の 3 か所に加える。武器種別・属性別の種別なら、
 * ATTACK_TYPE_DAMAGE_UP_KINDS も更新する。
 */

import type {
  AttackType,
  DamageUpKindDefinition,
  DamageUpStatusEffectKind,
  StatusEffectKind,
  StatusEffectKindDefinition,
  StatusEffectPolarity,
} from "@/lib/types";

export const STATUS_EFFECT_KIND_DEFINITIONS: Record<
  StatusEffectKind,
  StatusEffectKindDefinition
> = {
  axeDamageUp: {
    kind: "axeDamageUp",
    name: "斧攻撃ダメージアップ",
    polarity: "buff",
  },
  bookDamageUp: {
    kind: "bookDamageUp",
    name: "本攻撃ダメージアップ",
    polarity: "buff",
  },
  bowDamageUp: {
    kind: "bowDamageUp",
    name: "弓攻撃ダメージアップ",
    polarity: "buff",
  },
  breakDamageUp: {
    kind: "breakDamageUp",
    name: "ブレイク中ダメージアップ",
    polarity: "buff",
  },
  criticalDamageUp: {
    kind: "criticalDamageUp",
    name: "クリティカル時ダメージアップ",
    polarity: "buff",
  },
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
  daggerDamageUp: {
    kind: "daggerDamageUp",
    name: "短剣攻撃ダメージアップ",
    polarity: "buff",
  },
  damageUp: {
    kind: "damageUp",
    name: "ダメージアップ",
    polarity: "buff",
  },
  darkDamageUp: {
    kind: "darkDamageUp",
    name: "闇属性ダメージアップ",
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
  elementalDamageUp: {
    kind: "elementalDamageUp",
    name: "属性ダメージアップ",
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
  fanDamageUp: {
    kind: "fanDamageUp",
    name: "扇攻撃ダメージアップ",
    polarity: "buff",
  },
  fireDamageUp: {
    kind: "fireDamageUp",
    name: "火属性ダメージアップ",
    polarity: "buff",
  },
  iceDamageUp: {
    kind: "iceDamageUp",
    name: "氷属性ダメージアップ",
    polarity: "buff",
  },
  lightDamageUp: {
    kind: "lightDamageUp",
    name: "光属性ダメージアップ",
    polarity: "buff",
  },
  lightningDamageUp: {
    kind: "lightningDamageUp",
    name: "雷属性ダメージアップ",
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
  physicalDamageUp: {
    kind: "physicalDamageUp",
    name: "物理ダメージアップ",
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
  spearDamageUp: {
    kind: "spearDamageUp",
    name: "槍攻撃ダメージアップ",
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
  staffDamageUp: {
    kind: "staffDamageUp",
    name: "杖攻撃ダメージアップ",
    polarity: "buff",
  },
  swordDamageUp: {
    kind: "swordDamageUp",
    name: "剣攻撃ダメージアップ",
    polarity: "buff",
  },
  weaknessDamageUp: {
    kind: "weaknessDamageUp",
    name: "弱点時ダメージアップ",
    polarity: "buff",
  },
  windDamageUp: {
    kind: "windDamageUp",
    name: "風属性ダメージアップ",
    polarity: "buff",
  },
};

/**
 * ダメージアップ系の種別の、攻撃時の合算に使うマスターデータ。
 *
 * 種別ごとに、掛かる攻撃種別と発動条件を定義する。
 * 武器種別・属性別の種別は、攻撃種別 14 種のそれぞれにちょうど 1 つずつ対応する。
 */
export const DAMAGE_UP_KIND_DEFINITIONS: Record<
  DamageUpStatusEffectKind,
  DamageUpKindDefinition
> = {
  axeDamageUp: {
    kind: "axeDamageUp",
    target: { type: "attackType", attackType: "axe" },
    condition: null,
  },
  bookDamageUp: {
    kind: "bookDamageUp",
    target: { type: "attackType", attackType: "book" },
    condition: null,
  },
  bowDamageUp: {
    kind: "bowDamageUp",
    target: { type: "attackType", attackType: "bow" },
    condition: null,
  },
  breakDamageUp: {
    kind: "breakDamageUp",
    target: { type: "any" },
    condition: "break",
  },
  criticalDamageUp: {
    kind: "criticalDamageUp",
    target: { type: "any" },
    condition: "critical",
  },
  daggerDamageUp: {
    kind: "daggerDamageUp",
    target: { type: "attackType", attackType: "dagger" },
    condition: null,
  },
  damageUp: {
    kind: "damageUp",
    target: { type: "any" },
    condition: null,
  },
  darkDamageUp: {
    kind: "darkDamageUp",
    target: { type: "attackType", attackType: "dark" },
    condition: null,
  },
  elementalDamageUp: {
    kind: "elementalDamageUp",
    target: { type: "elemental" },
    condition: null,
  },
  fanDamageUp: {
    kind: "fanDamageUp",
    target: { type: "attackType", attackType: "fan" },
    condition: null,
  },
  fireDamageUp: {
    kind: "fireDamageUp",
    target: { type: "attackType", attackType: "fire" },
    condition: null,
  },
  iceDamageUp: {
    kind: "iceDamageUp",
    target: { type: "attackType", attackType: "ice" },
    condition: null,
  },
  lightDamageUp: {
    kind: "lightDamageUp",
    target: { type: "attackType", attackType: "light" },
    condition: null,
  },
  lightningDamageUp: {
    kind: "lightningDamageUp",
    target: { type: "attackType", attackType: "lightning" },
    condition: null,
  },
  physicalDamageUp: {
    kind: "physicalDamageUp",
    target: { type: "physical" },
    condition: null,
  },
  spearDamageUp: {
    kind: "spearDamageUp",
    target: { type: "attackType", attackType: "spear" },
    condition: null,
  },
  staffDamageUp: {
    kind: "staffDamageUp",
    target: { type: "attackType", attackType: "staff" },
    condition: null,
  },
  swordDamageUp: {
    kind: "swordDamageUp",
    target: { type: "attackType", attackType: "sword" },
    condition: null,
  },
  weaknessDamageUp: {
    kind: "weaknessDamageUp",
    target: { type: "any" },
    condition: "weakness",
  },
  windDamageUp: {
    kind: "windDamageUp",
    target: { type: "attackType", attackType: "wind" },
    condition: null,
  },
};

/**
 * 武器種・属性と、それに対応する武器種別・属性別のダメージアップの種別の対応表。
 *
 * {@link DAMAGE_UP_KIND_DEFINITIONS} の `target.type === "attackType"` の定義と 1 対 1 に対応する。
 */
export const ATTACK_TYPE_DAMAGE_UP_KINDS: Record<
  AttackType,
  DamageUpStatusEffectKind
> = {
  axe: "axeDamageUp",
  book: "bookDamageUp",
  bow: "bowDamageUp",
  dagger: "daggerDamageUp",
  dark: "darkDamageUp",
  fan: "fanDamageUp",
  fire: "fireDamageUp",
  ice: "iceDamageUp",
  light: "lightDamageUp",
  lightning: "lightningDamageUp",
  spear: "spearDamageUp",
  staff: "staffDamageUp",
  sword: "swordDamageUp",
  wind: "windDamageUp",
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

/** ダメージアップ系の種別かを返す。 */
export const isDamageUpStatusEffectKind = (
  kind: StatusEffectKind,
): kind is DamageUpStatusEffectKind =>
  Object.hasOwn(DAMAGE_UP_KIND_DEFINITIONS, kind);

/** すべてのダメージアップ系の種別のマスターデータを定義順（ASCII 順）で返す。 */
export const listDamageUpKindDefinitions = (): DamageUpKindDefinition[] =>
  Object.values(DAMAGE_UP_KIND_DEFINITIONS);

/**
 * 指定した武器種・属性に対応する、武器種別・属性別のダメージアップの種別を返す
 * （例: `sword` → `swordDamageUp`）。
 */
export const getAttackTypeDamageUpKind = (
  attackType: AttackType,
): DamageUpStatusEffectKind => ATTACK_TYPE_DAMAGE_UP_KINDS[attackType];
