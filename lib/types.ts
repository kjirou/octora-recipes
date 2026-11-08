/**
 * octora-recipes のドメイン型定義。
 *
 * ゲーム『OCTOPATH TRAVELER 大陸の覇者』のレシピ（パーティ編成 + ターンごとの行動）を
 * 表現するための型をこのファイルに集約する。設計の全体像を 1 ファイルで俯瞰できるように、
 * 意図的に分割せず大きなファイルとして保つ。ゲームルールの前提は CLAUDE.md を参照。
 *
 * 利用側からは `import type { ... } from "@/lib/types"` で参照する。
 *
 * 構成（セクション）:
 *   1. 基本の列挙型      … ジョブ、武器種、属性、影響力、レアリティなど
 *   2. マスターデータ    … キャラクター、アビリティ、必殺技、敵・ボス
 *   3. パーティ編成      … 縦列、前衛 / 後衛、メンバー
 *   4. ターンと行動      … ターン、コマンド、ブースト段階、交代、対象
 *   5. レシピ            … 編成 + 行動手順 + メタ情報（対象コンテンツ、説明、作者、公開状態）
 *   6. 入出力・永続化    … API / フォーム / ストレージ向けの派生型
 */

// =============================================================================
// 1. 基本の列挙型
// =============================================================================

/** 武器種（物理攻撃の種別）。剣・槍・短剣・斧・弓・杖・本・扇の 8 種。 */
export type Weapon =
  "axe" | "book" | "bow" | "dagger" | "fan" | "spear" | "staff" | "sword";

/** 属性。火・氷・雷・風・光・闇の 6 種。 */
export type Element = "dark" | "fire" | "ice" | "light" | "lightning" | "wind";

/** 攻撃種別（14 種）。弱点・シールド・耐性アップ / ダウンの単位になる。 */
export type AttackType = Element | Weapon;

// =============================================================================
// 2. マスターデータ
// =============================================================================

// =============================================================================
// 3. パーティ編成
// =============================================================================

// =============================================================================
// 4. ターンと行動
// =============================================================================

/**
 * ブースト段階。
 *
 * 0 = なし, 1 = ×2, 2 = ×3, 3 = MAX。値はそのまま消費 BP に一致する。
 */
export type BoostLevel = 0 | 1 | 2 | 3;

// --- ステータス効果（バフ・デバフ） -------------------------------------------
//
// ゲーム内では「強化効果（バフ）」「弱体効果（デバフ）」と呼ばれる。
// 効果量（%）は「枠 × 種別」ごとにまとめて管理され、同じまとまりの中で加算される。
// 継続ターンも同じまとまりの中で合算される。詳細なルールは lib/domain/statusEffect.ts を参照。
//
// 現時点の実装対象はパラメーター系（物攻・属攻・物防・属防・速度・会心）のアップ / ダウンのみ。
// 耐性系・ダメージアップ系・威力アップなどは今後の検討事項。

/**
 * ステータス効果の種別。アップ / ダウンを展開した 1 つの列挙として扱う。
 *
 * バフにしか無い種別（威力アップなど）やデバフにしか無い種別があるため、
 * 「パラメーター × 向き」の組み合わせではなく種別そのものを列挙する。
 * 各種別の属性（バフかデバフか、表示名）は {@link StatusEffectKindDefinition} をマスターデータとして持つ。
 */
export type StatusEffectKind =
  | "criticalRateDown"
  | "criticalRateUp"
  | "elementalAttackDown"
  | "elementalAttackUp"
  | "elementalDefenseDown"
  | "elementalDefenseUp"
  | "physicalAttackDown"
  | "physicalAttackUp"
  | "physicalDefenseDown"
  | "physicalDefenseUp"
  | "speedDown"
  | "speedUp";

/** バフ（強化効果）かデバフ（弱体効果）か。種別の属性であり、種別から決まる。 */
export type StatusEffectPolarity = "buff" | "debuff";

/** ステータス効果の種別のマスターデータ 1 件。 */
export type StatusEffectKindDefinition = {
  kind: StatusEffectKind;
  /** 日本語の表示名（例: 物攻アップ）。 */
  name: string;
  polarity: StatusEffectPolarity;
};

/**
 * バフ・デバフの「枠」。効果量の上限（基本 30%）は枠ごとに別々に数える。
 *
 * - `battleAbility` … バトルアビリティ。支援者・援魔石（神獣を除く）・EX アビリティも含む
 * - `supportAbility` … サポートアビリティと装備性能（アクセサリー等）
 * - `ultimate` … 必殺技
 * - `sacredBeast` … 神獣（援魔石の神獣効果）
 * - `flameBeast` … 支炎獣
 */
export type StatusEffectSlot =
  | "battleAbility"
  | "flameBeast"
  | "sacredBeast"
  | "supportAbility"
  | "ultimate";

/**
 * バフ・デバフの継続期間。
 *
 * - `permanent` … ターン無し。「前衛時物攻アップ」のように条件を満たす間ずっと有効なもの。
 *   条件が外れたら明示的に取り除く
 * - `turns` … ターン付き。付与したターンを 1 ターン目として数え、ターン終了時に 1 減る
 */
export type StatusEffectDuration =
  { type: "permanent" } | { type: "turns"; turns: number };

/**
 * バフ・デバフの付与元。「誰のどのアビリティか」で識別する。
 *
 * 「同じアビリティの重ね掛けでは効果量が増えない」判定と、ターン無し効果の取り除きに使う。
 * 同名アビリティでも使用キャラが違えば別の付与元になる。
 * キャラクターのステータスを参照する効果のために、キャラクター単体でも識別できるようにしている。
 */
export type StatusEffectSource = {
  characterId: string;
  abilityId: string;
  /**
   * 同じキャラ・同じアビリティでも別の付与元として扱いたい場合の区別。
   *
   * 例: ティティの「猛将の鼓舞Ⅲ」は説明に「ブースト MAX 時重複可」とあり、ブースト MAX で
   * 使った場合とそれ以外で使った場合を重ね掛けできる。このようなアビリティをブースト MAX で
   * 使った場合に `"boostMax"` を指定すると、同じアビリティでも別の付与元として効果量が加算される。
   */
  variant?: string;
};

/**
 * アビリティ等が 1 回の行動で付与するバフ・デバフ 1 件分の内容。
 */
export type StatusEffectApplication = {
  slot: StatusEffectSlot;
  kind: StatusEffectKind;
  /** 効果量（%）。正の値。 */
  magnitude: number;
  duration: StatusEffectDuration;
  source: StatusEffectSource;
  /**
   * ターン付き効果を同じ付与元から重ねたとき、効果量も加算するか。既定は false。
   *
   * 支援者・援魔石の効果など、同じ技を繰り返しても効果量が重なるものに true を指定する。
   * ターン無し効果には影響しない。
   */
  stacksWithSameSource?: boolean;
};

/** まとまりに含まれるターン無し効果 1 件。 */
export type StatusEffectPermanentSource = {
  source: StatusEffectSource;
  /** 効果量（%）。 */
  magnitude: number;
};

/**
 * ある対象にかかっている、同じ「枠 × 種別」のバフ・デバフのまとまり。
 *
 * 効果量はターン無し・ターン付きを合わせてこの単位で合算される。
 * 継続ターンはターン付きの効果だけで合算される。
 * 効果量は上限を適用する前の生の値で持ち、参照時に上限を適用する。
 */
export type StatusEffectPool = {
  slot: StatusEffectSlot;
  kind: StatusEffectKind;
  /** ターン無し効果の一覧。 */
  permanentSources: StatusEffectPermanentSource[];
  /** ターン付き効果の効果量（%）の合計。切れるまで下がらない。 */
  timedMagnitude: number;
  /** ターン付き効果の残りターン数。現在のターンを含む。ターン付き効果が無ければ 0。 */
  remainingTurns: number;
  /** ターン付き効果として効果量を寄与した付与元。 */
  timedSources: StatusEffectSource[];
};

/** ある対象（味方 1 人または敵 1 体）にかかっているバフ・デバフ全体。 */
export type StatusEffectState = readonly StatusEffectPool[];

// =============================================================================
// 5. レシピ
// =============================================================================

// =============================================================================
// 6. 入出力・永続化
// =============================================================================
