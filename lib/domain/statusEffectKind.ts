/**
 * ステータス効果の種別のマスターデータ。
 *
 * 種別ごとに、バフかデバフか（向き）、日本語の表示名、効果量の単位と既定の上限を定義する。
 * ダメージアップ系の種別には、攻撃時の合算に使う属性（掛かる攻撃種別と発動条件）も定義する。
 * ダメージ上限アップ系の種別には、攻撃時の合算に使う属性（掛かる攻撃種別）も定義する。
 * 耐性系の種別には、攻撃を受けた時の合算に使う属性（掛かる攻撃種別）も定義する。
 * 種別を追加するときは lib/types.ts の StatusEffectKind と、ここの定義の両方に加える
 * （Record 型なので、片方だけ加えると型エラーになる）。ダメージアップ系の種別は、
 * lib/types.ts の DamageUpStatusEffectKind・STATUS_EFFECT_KIND_DEFINITIONS・
 * DAMAGE_UP_KIND_DEFINITIONS の 3 か所に加える。武器種別・属性別の種別なら、
 * ATTACK_TYPE_DAMAGE_UP_KINDS も更新する。ダメージ上限アップ系の種別は、
 * lib/types.ts の DamageCapUpStatusEffectKind・STATUS_EFFECT_KIND_DEFINITIONS・
 * DAMAGE_CAP_UP_KIND_DEFINITIONS の 3 か所に加える。耐性系の種別は、lib/types.ts の
 * ResistanceUpStatusEffectKind / ResistanceDownStatusEffectKind・STATUS_EFFECT_KIND_DEFINITIONS・
 * RESISTANCE_KIND_DEFINITIONS の 3 か所に加え、武器種別・属性別の種別なら
 * ATTACK_TYPE_RESISTANCE_UP_KINDS / ATTACK_TYPE_RESISTANCE_DOWN_KINDS も更新する。
 */

import type {
  AttackType,
  DamageCapUpKindDefinition,
  DamageCapUpStatusEffectKind,
  DamageUpKindDefinition,
  DamageUpStatusEffectKind,
  ResistanceDownStatusEffectKind,
  ResistanceKindDefinition,
  ResistanceStatusEffectKind,
  ResistanceUpStatusEffectKind,
  StatusEffectKind,
  StatusEffectKindDefinition,
  StatusEffectPolarity,
} from "@/lib/types";

/**
 * パラメーター系・ダメージアップ系・耐性系の、上限引き上げ効果が無いときの効果量（%）の上限。
 *
 * パラメーター系では「枠 × 種別」、ダメージアップ系では「枠 × ダメージ計算の攻撃種別」、
 * 耐性系では「枠 × 受ける攻撃のダメージ計算の攻撃種別」ごとに掛かる。
 */
export const DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP = 30;

export const STATUS_EFFECT_KIND_DEFINITIONS: Record<
  StatusEffectKind,
  StatusEffectKindDefinition
> = {
  axeDamageCapUp: {
    kind: "axeDamageCapUp",
    name: "斧攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  axeDamageUp: {
    kind: "axeDamageUp",
    name: "斧攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  axeResistanceDown: {
    kind: "axeResistanceDown",
    name: "斧耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  axeResistanceUp: {
    kind: "axeResistanceUp",
    name: "斧耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bookDamageCapUp: {
    kind: "bookDamageCapUp",
    name: "本攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  bookDamageUp: {
    kind: "bookDamageUp",
    name: "本攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bookResistanceDown: {
    kind: "bookResistanceDown",
    name: "本耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bookResistanceUp: {
    kind: "bookResistanceUp",
    name: "本耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bowDamageCapUp: {
    kind: "bowDamageCapUp",
    name: "弓攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  bowDamageUp: {
    kind: "bowDamageUp",
    name: "弓攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bowResistanceDown: {
    kind: "bowResistanceDown",
    name: "弓耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  bowResistanceUp: {
    kind: "bowResistanceUp",
    name: "弓耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  breakDamageUp: {
    kind: "breakDamageUp",
    name: "ブレイク中ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  criticalDamageUp: {
    kind: "criticalDamageUp",
    name: "クリティカル時ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  criticalRateDown: {
    kind: "criticalRateDown",
    name: "会心ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  criticalRateUp: {
    kind: "criticalRateUp",
    name: "会心アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  daggerDamageCapUp: {
    kind: "daggerDamageCapUp",
    name: "短剣攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  daggerDamageUp: {
    kind: "daggerDamageUp",
    name: "短剣攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  daggerResistanceDown: {
    kind: "daggerResistanceDown",
    name: "短剣耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  daggerResistanceUp: {
    kind: "daggerResistanceUp",
    name: "短剣耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  damageCapUp: {
    kind: "damageCapUp",
    name: "ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  damageUp: {
    kind: "damageUp",
    name: "ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  darkDamageCapUp: {
    kind: "darkDamageCapUp",
    name: "闇属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  darkDamageUp: {
    kind: "darkDamageUp",
    name: "闇属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  darkResistanceDown: {
    kind: "darkResistanceDown",
    name: "闇耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  darkResistanceUp: {
    kind: "darkResistanceUp",
    name: "闇耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalAttackDown: {
    kind: "elementalAttackDown",
    name: "属攻ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalAttackUp: {
    kind: "elementalAttackUp",
    name: "属攻アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalDamageCapUp: {
    kind: "elementalDamageCapUp",
    name: "属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  elementalDamageUp: {
    kind: "elementalDamageUp",
    name: "属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalDefenseDown: {
    kind: "elementalDefenseDown",
    name: "属防ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalDefenseUp: {
    kind: "elementalDefenseUp",
    name: "属防アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalResistanceDown: {
    kind: "elementalResistanceDown",
    name: "属性耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  elementalResistanceUp: {
    kind: "elementalResistanceUp",
    name: "属性耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fanDamageCapUp: {
    kind: "fanDamageCapUp",
    name: "扇攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  fanDamageUp: {
    kind: "fanDamageUp",
    name: "扇攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fanResistanceDown: {
    kind: "fanResistanceDown",
    name: "扇耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fanResistanceUp: {
    kind: "fanResistanceUp",
    name: "扇耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fireDamageCapUp: {
    kind: "fireDamageCapUp",
    name: "火属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  fireDamageUp: {
    kind: "fireDamageUp",
    name: "火属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fireResistanceDown: {
    kind: "fireResistanceDown",
    name: "火耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  fireResistanceUp: {
    kind: "fireResistanceUp",
    name: "火耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  iceDamageCapUp: {
    kind: "iceDamageCapUp",
    name: "氷属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  iceDamageUp: {
    kind: "iceDamageUp",
    name: "氷属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  iceResistanceDown: {
    kind: "iceResistanceDown",
    name: "氷耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  iceResistanceUp: {
    kind: "iceResistanceUp",
    name: "氷耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightDamageCapUp: {
    kind: "lightDamageCapUp",
    name: "光属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  lightDamageUp: {
    kind: "lightDamageUp",
    name: "光属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightResistanceDown: {
    kind: "lightResistanceDown",
    name: "光耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightResistanceUp: {
    kind: "lightResistanceUp",
    name: "光耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightningDamageCapUp: {
    kind: "lightningDamageCapUp",
    name: "雷属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  lightningDamageUp: {
    kind: "lightningDamageUp",
    name: "雷属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightningResistanceDown: {
    kind: "lightningResistanceDown",
    name: "雷耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  lightningResistanceUp: {
    kind: "lightningResistanceUp",
    name: "雷耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalAttackDown: {
    kind: "physicalAttackDown",
    name: "物攻ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalAttackUp: {
    kind: "physicalAttackUp",
    name: "物攻アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalDamageCapUp: {
    kind: "physicalDamageCapUp",
    name: "物理ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  physicalDamageUp: {
    kind: "physicalDamageUp",
    name: "物理ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalDefenseDown: {
    kind: "physicalDefenseDown",
    name: "物防ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalDefenseUp: {
    kind: "physicalDefenseUp",
    name: "物防アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalResistanceDown: {
    kind: "physicalResistanceDown",
    name: "物理耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  physicalResistanceUp: {
    kind: "physicalResistanceUp",
    name: "物理耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  spearDamageCapUp: {
    kind: "spearDamageCapUp",
    name: "槍攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  spearDamageUp: {
    kind: "spearDamageUp",
    name: "槍攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  spearResistanceDown: {
    kind: "spearResistanceDown",
    name: "槍耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  spearResistanceUp: {
    kind: "spearResistanceUp",
    name: "槍耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  speedDown: {
    kind: "speedDown",
    name: "速度ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  speedUp: {
    kind: "speedUp",
    name: "速度アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  staffDamageCapUp: {
    kind: "staffDamageCapUp",
    name: "杖攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  staffDamageUp: {
    kind: "staffDamageUp",
    name: "杖攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  staffResistanceDown: {
    kind: "staffResistanceDown",
    name: "杖耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  staffResistanceUp: {
    kind: "staffResistanceUp",
    name: "杖耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  swordDamageCapUp: {
    kind: "swordDamageCapUp",
    name: "剣攻撃ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  swordDamageUp: {
    kind: "swordDamageUp",
    name: "剣攻撃ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  swordResistanceDown: {
    kind: "swordResistanceDown",
    name: "剣耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  swordResistanceUp: {
    kind: "swordResistanceUp",
    name: "剣耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  weaknessDamageUp: {
    kind: "weaknessDamageUp",
    name: "弱点時ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  windDamageCapUp: {
    kind: "windDamageCapUp",
    name: "風属性ダメージ上限アップ",
    polarity: "buff",
    magnitudeUnit: "absolute",
    defaultMagnitudeCap: null,
  },
  windDamageUp: {
    kind: "windDamageUp",
    name: "風属性ダメージアップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  windResistanceDown: {
    kind: "windResistanceDown",
    name: "風耐性ダウン",
    polarity: "debuff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
  },
  windResistanceUp: {
    kind: "windResistanceUp",
    name: "風耐性アップ",
    polarity: "buff",
    magnitudeUnit: "percent",
    defaultMagnitudeCap: DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
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

/**
 * ダメージ上限アップ系の種別の、攻撃時の合算に使うマスターデータ。
 *
 * 種別ごとに、掛かる攻撃種別を定義する。武器種別・属性別の種別は、攻撃種別 14 種のそれぞれに
 * ちょうど 1 つずつ対応する。
 */
export const DAMAGE_CAP_UP_KIND_DEFINITIONS: Record<
  DamageCapUpStatusEffectKind,
  DamageCapUpKindDefinition
> = {
  axeDamageCapUp: {
    kind: "axeDamageCapUp",
    target: { type: "attackType", attackType: "axe" },
  },
  bookDamageCapUp: {
    kind: "bookDamageCapUp",
    target: { type: "attackType", attackType: "book" },
  },
  bowDamageCapUp: {
    kind: "bowDamageCapUp",
    target: { type: "attackType", attackType: "bow" },
  },
  daggerDamageCapUp: {
    kind: "daggerDamageCapUp",
    target: { type: "attackType", attackType: "dagger" },
  },
  damageCapUp: {
    kind: "damageCapUp",
    target: { type: "any" },
  },
  darkDamageCapUp: {
    kind: "darkDamageCapUp",
    target: { type: "attackType", attackType: "dark" },
  },
  elementalDamageCapUp: {
    kind: "elementalDamageCapUp",
    target: { type: "elemental" },
  },
  fanDamageCapUp: {
    kind: "fanDamageCapUp",
    target: { type: "attackType", attackType: "fan" },
  },
  fireDamageCapUp: {
    kind: "fireDamageCapUp",
    target: { type: "attackType", attackType: "fire" },
  },
  iceDamageCapUp: {
    kind: "iceDamageCapUp",
    target: { type: "attackType", attackType: "ice" },
  },
  lightDamageCapUp: {
    kind: "lightDamageCapUp",
    target: { type: "attackType", attackType: "light" },
  },
  lightningDamageCapUp: {
    kind: "lightningDamageCapUp",
    target: { type: "attackType", attackType: "lightning" },
  },
  physicalDamageCapUp: {
    kind: "physicalDamageCapUp",
    target: { type: "physical" },
  },
  spearDamageCapUp: {
    kind: "spearDamageCapUp",
    target: { type: "attackType", attackType: "spear" },
  },
  staffDamageCapUp: {
    kind: "staffDamageCapUp",
    target: { type: "attackType", attackType: "staff" },
  },
  swordDamageCapUp: {
    kind: "swordDamageCapUp",
    target: { type: "attackType", attackType: "sword" },
  },
  windDamageCapUp: {
    kind: "windDamageCapUp",
    target: { type: "attackType", attackType: "wind" },
  },
};

/**
 * 耐性系の種別の、攻撃を受けた時の合算に使うマスターデータ。
 *
 * 種別ごとに、掛かる（受ける）攻撃種別を定義する。耐性アップ・耐性ダウンのそれぞれで、
 * 武器種別・属性別の種別は攻撃種別 14 種のそれぞれにちょうど 1 つずつ対応する。
 */
export const RESISTANCE_KIND_DEFINITIONS: Record<
  ResistanceStatusEffectKind,
  ResistanceKindDefinition
> = {
  axeResistanceDown: {
    kind: "axeResistanceDown",
    target: { type: "attackType", attackType: "axe" },
  },
  axeResistanceUp: {
    kind: "axeResistanceUp",
    target: { type: "attackType", attackType: "axe" },
  },
  bookResistanceDown: {
    kind: "bookResistanceDown",
    target: { type: "attackType", attackType: "book" },
  },
  bookResistanceUp: {
    kind: "bookResistanceUp",
    target: { type: "attackType", attackType: "book" },
  },
  bowResistanceDown: {
    kind: "bowResistanceDown",
    target: { type: "attackType", attackType: "bow" },
  },
  bowResistanceUp: {
    kind: "bowResistanceUp",
    target: { type: "attackType", attackType: "bow" },
  },
  daggerResistanceDown: {
    kind: "daggerResistanceDown",
    target: { type: "attackType", attackType: "dagger" },
  },
  daggerResistanceUp: {
    kind: "daggerResistanceUp",
    target: { type: "attackType", attackType: "dagger" },
  },
  darkResistanceDown: {
    kind: "darkResistanceDown",
    target: { type: "attackType", attackType: "dark" },
  },
  darkResistanceUp: {
    kind: "darkResistanceUp",
    target: { type: "attackType", attackType: "dark" },
  },
  elementalResistanceDown: {
    kind: "elementalResistanceDown",
    target: { type: "elemental" },
  },
  elementalResistanceUp: {
    kind: "elementalResistanceUp",
    target: { type: "elemental" },
  },
  fanResistanceDown: {
    kind: "fanResistanceDown",
    target: { type: "attackType", attackType: "fan" },
  },
  fanResistanceUp: {
    kind: "fanResistanceUp",
    target: { type: "attackType", attackType: "fan" },
  },
  fireResistanceDown: {
    kind: "fireResistanceDown",
    target: { type: "attackType", attackType: "fire" },
  },
  fireResistanceUp: {
    kind: "fireResistanceUp",
    target: { type: "attackType", attackType: "fire" },
  },
  iceResistanceDown: {
    kind: "iceResistanceDown",
    target: { type: "attackType", attackType: "ice" },
  },
  iceResistanceUp: {
    kind: "iceResistanceUp",
    target: { type: "attackType", attackType: "ice" },
  },
  lightResistanceDown: {
    kind: "lightResistanceDown",
    target: { type: "attackType", attackType: "light" },
  },
  lightResistanceUp: {
    kind: "lightResistanceUp",
    target: { type: "attackType", attackType: "light" },
  },
  lightningResistanceDown: {
    kind: "lightningResistanceDown",
    target: { type: "attackType", attackType: "lightning" },
  },
  lightningResistanceUp: {
    kind: "lightningResistanceUp",
    target: { type: "attackType", attackType: "lightning" },
  },
  physicalResistanceDown: {
    kind: "physicalResistanceDown",
    target: { type: "physical" },
  },
  physicalResistanceUp: {
    kind: "physicalResistanceUp",
    target: { type: "physical" },
  },
  spearResistanceDown: {
    kind: "spearResistanceDown",
    target: { type: "attackType", attackType: "spear" },
  },
  spearResistanceUp: {
    kind: "spearResistanceUp",
    target: { type: "attackType", attackType: "spear" },
  },
  staffResistanceDown: {
    kind: "staffResistanceDown",
    target: { type: "attackType", attackType: "staff" },
  },
  staffResistanceUp: {
    kind: "staffResistanceUp",
    target: { type: "attackType", attackType: "staff" },
  },
  swordResistanceDown: {
    kind: "swordResistanceDown",
    target: { type: "attackType", attackType: "sword" },
  },
  swordResistanceUp: {
    kind: "swordResistanceUp",
    target: { type: "attackType", attackType: "sword" },
  },
  windResistanceDown: {
    kind: "windResistanceDown",
    target: { type: "attackType", attackType: "wind" },
  },
  windResistanceUp: {
    kind: "windResistanceUp",
    target: { type: "attackType", attackType: "wind" },
  },
};

/**
 * 武器種・属性と、それに対応する武器種別・属性別の耐性アップの種別の対応表。
 *
 * {@link RESISTANCE_KIND_DEFINITIONS} の耐性アップのうち、`target.type === "attackType"` の
 * 定義と 1 対 1 に対応する。
 */
export const ATTACK_TYPE_RESISTANCE_UP_KINDS: Record<
  AttackType,
  ResistanceUpStatusEffectKind
> = {
  axe: "axeResistanceUp",
  book: "bookResistanceUp",
  bow: "bowResistanceUp",
  dagger: "daggerResistanceUp",
  dark: "darkResistanceUp",
  fan: "fanResistanceUp",
  fire: "fireResistanceUp",
  ice: "iceResistanceUp",
  light: "lightResistanceUp",
  lightning: "lightningResistanceUp",
  spear: "spearResistanceUp",
  staff: "staffResistanceUp",
  sword: "swordResistanceUp",
  wind: "windResistanceUp",
};

/**
 * 武器種・属性と、それに対応する武器種別・属性別の耐性ダウンの種別の対応表。
 *
 * {@link RESISTANCE_KIND_DEFINITIONS} の耐性ダウンのうち、`target.type === "attackType"` の
 * 定義と 1 対 1 に対応する。
 */
export const ATTACK_TYPE_RESISTANCE_DOWN_KINDS: Record<
  AttackType,
  ResistanceDownStatusEffectKind
> = {
  axe: "axeResistanceDown",
  book: "bookResistanceDown",
  bow: "bowResistanceDown",
  dagger: "daggerResistanceDown",
  dark: "darkResistanceDown",
  fan: "fanResistanceDown",
  fire: "fireResistanceDown",
  ice: "iceResistanceDown",
  light: "lightResistanceDown",
  lightning: "lightningResistanceDown",
  spear: "spearResistanceDown",
  staff: "staffResistanceDown",
  sword: "swordResistanceDown",
  wind: "windResistanceDown",
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

/** ダメージ上限アップ系の種別かを返す。 */
export const isDamageCapUpStatusEffectKind = (
  kind: StatusEffectKind,
): kind is DamageCapUpStatusEffectKind =>
  Object.hasOwn(DAMAGE_CAP_UP_KIND_DEFINITIONS, kind);

/** すべてのダメージ上限アップ系の種別のマスターデータを定義順（ASCII 順）で返す。 */
export const listDamageCapUpKindDefinitions = (): DamageCapUpKindDefinition[] =>
  Object.values(DAMAGE_CAP_UP_KIND_DEFINITIONS);

/**
 * 指定した武器種・属性に対応する、武器種別・属性別のダメージアップの種別を返す
 * （例: `sword` → `swordDamageUp`）。
 */
export const getAttackTypeDamageUpKind = (
  attackType: AttackType,
): DamageUpStatusEffectKind => ATTACK_TYPE_DAMAGE_UP_KINDS[attackType];

/** 耐性系の種別かを返す。 */
export const isResistanceStatusEffectKind = (
  kind: StatusEffectKind,
): kind is ResistanceStatusEffectKind =>
  Object.hasOwn(RESISTANCE_KIND_DEFINITIONS, kind);

/** すべての耐性系の種別のマスターデータを定義順（ASCII 順）で返す。 */
export const listResistanceKindDefinitions = (): ResistanceKindDefinition[] =>
  Object.values(RESISTANCE_KIND_DEFINITIONS);

/**
 * 指定した武器種・属性と向きに対応する、武器種別・属性別の耐性系の種別を返す
 * （例: `spear` と `debuff` → `spearResistanceDown`）。
 *
 * @param polarity `buff` なら耐性アップ、`debuff` なら耐性ダウン
 */
export const getAttackTypeResistanceKind = (
  attackType: AttackType,
  polarity: StatusEffectPolarity,
): ResistanceStatusEffectKind =>
  polarity === "buff"
    ? ATTACK_TYPE_RESISTANCE_UP_KINDS[attackType]
    : ATTACK_TYPE_RESISTANCE_DOWN_KINDS[attackType];
