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

/**
 * ダメージ計算に使う攻撃種別。{@link AttackType} の 14 種に無属性を加えたもの。
 *
 * 1 回の攻撃のダメージ計算に使う攻撃種別は必ず 1 つ。「どの弱点を突けるか」とは別のレイヤーで、
 * 複数の弱点を突ける攻撃でもダメージ計算の攻撃種別は 1 つに明示される
 * （例: 最終皇帝(女)「クリムゾンフレア」は火弱点を突けるが、ダメージ計算は光属性）。
 *
 * - `nonElemental` … 無属性（例: リルム「スタープリズム」）。弱点・シールドの単位にはならない
 */
export type DamageAttackType = AttackType | "nonElemental";

/**
 * ジョブ。剣士・商人・盗賊・薬師・狩人・神官・学者・踊子の 8 種。
 *
 * - `apothecary` … 薬師（斧）
 * - `cleric` … 神官（杖）
 * - `dancer` … 踊子（扇）
 * - `hunter` … 狩人（弓）
 * - `merchant` … 商人（槍）
 * - `scholar` … 学者（本）
 * - `thief` … 盗賊（短剣）
 * - `warrior` … 剣士（剣）
 */
export type Job =
  | "apothecary"
  | "cleric"
  | "dancer"
  | "hunter"
  | "merchant"
  | "scholar"
  | "thief"
  | "warrior";

/**
 * 影響力。キャラクターごとにいずれか 1 つを持つ。
 *
 * - `fame` … 名声（承認）
 * - `power` … 権力（支配）
 * - `wealth` … 富（所有）
 */
export type Influence = "fame" | "power" | "wealth";

/**
 * キャラクターのレアリティ（★3 / ★4 / ★5）。
 *
 * 他の列挙型と違い数値リテラルの union にしている。値が ★ の数そのもので、大小の比較にも使えるため。
 */
export type Rarity = 3 | 4 | 5;

// =============================================================================
// 2. マスターデータ
// =============================================================================
//
// キャラクター・アビリティのように「増え続ける・ID で参照する」静的データの型。
// データ本体は lib/data/ に置く。データ種別ごとに次の 2 段の型を持つ。
//
// - XxxDataDef … データ定義用の型。省略可能なプロパティを含む。プロパティは ASCII 順
// - XxxData … 省略可能なプロパティに既定値を補完した、読み取り専用の型
//
// ステータス効果の種別や状態異常の種別のような閉じた列挙のマスターデータは、
// ここではなく lib/domain/ に置く。

/** マスターデータの ID。データ種別の中で一意。 */
export type DataId = string;

// アビリティはアクティブアビリティとパッシブアビリティに大別する。両者は扱いが大きく異なるため、
// 型もデータ種別（lib/data/activeAbilities/ と lib/data/passiveAbilities/）も分ける。
// どちらもキャラクターへの参照は持たない（キャラクター側が ID の一覧で参照する）。
// 効果の内容（付与するステータス効果・威力アップなど）は未定義。

/**
 * アクティブアビリティの種類。プレイヤーが行動として選択して使うもの。
 *
 * - `battleAbility` … バトルアビリティ（SP 消費）
 * - `exAbility` … EX アビリティ（使用回数制限のあるバトルアビリティ）
 * - `ultimate` … 必殺技
 */
export type ActiveAbilityCategory = "battleAbility" | "exAbility" | "ultimate";

/** アクティブアビリティのデータ定義用の型。 */
export type ActiveAbilityDataDef = Readonly<{
  category: ActiveAbilityCategory;
  /** 一意な ID（例: `"ryukku:mixBlasterMine"`）。命名規則は lib/data/activeAbilities/index.ts を参照。 */
  id: DataId;
  /** 日本語の表示名。ゲーム内の表記に合わせる（例: `"調合：ブラスターマイン"`）。 */
  name: string;
}>;

/** アクティブアビリティの読み取り専用データ。 */
export type ActiveAbilityData = Readonly<Required<ActiveAbilityDataDef>>;

/**
 * パッシブアビリティの種類。行動を消費せず自動で効く（または常時掛かる）もの。
 *
 * - `supportAbility` … サポートアビリティ（後衛からでも発動する）
 *
 * 今後、ベーシックアビリティ・灯火の加護・灯火の加護強化ボーナスを追加する。
 */
export type PassiveAbilityCategory = "supportAbility";

/** パッシブアビリティのデータ定義用の型。 */
export type PassiveAbilityDataDef = Readonly<{
  category: PassiveAbilityCategory;
  /** 一意な ID（例: `"ryukku:albedoChieftainsDaughter"`）。命名規則は lib/data/passiveAbilities/index.ts を参照。 */
  id: DataId;
  /** 日本語の表示名。ゲーム内の表記に合わせる（例: `"アルベド族長の娘"`）。 */
  name: string;
}>;

/** パッシブアビリティの読み取り専用データ。 */
export type PassiveAbilityData = Readonly<Required<PassiveAbilityDataDef>>;

/** キャラクター（旅人）のデータ定義用の型。 */
export type CharacterDataDef = Readonly<{
  /** そのキャラクターが持つアクティブアビリティの ID 一覧。 */
  activeAbilityDataIds: readonly DataId[];
  /** 一意な ID（例: `"ryukku"`）。命名規則は lib/data/characters/index.ts を参照。 */
  id: DataId;
  influence: Influence;
  job: Job;
  /** 日本語の表示名。ゲーム内の表記に合わせる（例: `"七英雄ロックブーケ"`）。 */
  name: string;
  /** そのキャラクターが持つパッシブアビリティの ID 一覧。 */
  passiveAbilityDataIds: readonly DataId[];
  rarity: Rarity;
}>;

/** キャラクターの読み取り専用データ。 */
export type CharacterData = Readonly<Required<CharacterDataDef>>;

/**
 * 全データ種別の辞書と一覧をまとめたもの。
 *
 * ロジック側は lib/data/ を直接 import せず、これを引数で受け取る。
 */
export type DataCatalog = Readonly<{
  activeAbilityDataDict: Readonly<Record<DataId, ActiveAbilityData>>;
  activeAbilityDataList: ReadonlyArray<ActiveAbilityData>;
  characterDataDict: Readonly<Record<DataId, CharacterData>>;
  characterDataList: ReadonlyArray<CharacterData>;
  passiveAbilityDataDict: Readonly<Record<DataId, PassiveAbilityData>>;
  passiveAbilityDataList: ReadonlyArray<PassiveAbilityData>;
}>;

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

// --- 状態効果の大分類 -----------------------------------------------------------
//
// ゲーム内でキャラクターや敵に付与される「状態効果」には、並列する 3 つの概念がある。
// それぞれ継続ターンの延長ロジックや重複ロジックが異なるため、別々の型・モジュールで扱う。
//
// - ステータス効果（強化効果 / 弱体効果 = バフ / デバフ） … StatusEffect*。実装済み
// - 状態異常（毒・麻痺・沈黙など）                         … StatusAilment*。型のみ
// - 特殊効果（キャラ固有の「一献」「激情」、敵由来の「死の宣告」など） … SpecialEffect*。型のみ
// - 威力アップ（攻撃アビリティの威力倍率を上げる効果）       … PowerUp*。実装済み

/**
 * 状態効果の大分類。ゲーム内の表現との対応は次のとおり。
 *
 * - `powerUp` … 威力アップ
 * - `statusEffect` … 強化効果 / 弱体効果（バフ / デバフ）
 * - `statusAilment` … 状態異常
 * - `specialEffect` … 特殊効果
 */
export type BattleConditionCategory =
  "powerUp" | "specialEffect" | "statusAilment" | "statusEffect";

// --- ステータス効果（バフ・デバフ） -------------------------------------------
//
// ゲーム内では「強化効果（バフ）」「弱体効果（デバフ）」と呼ばれる。
// 効果量は「枠 × 種別」ごとにまとめて管理され、同じまとまりの中で加算される。
// 効果量の単位（% / 絶対値）と既定の上限は種別ごとに決まる。
// 継続ターンも同じまとまりの中で合算される。詳細なルールは lib/domain/statusEffect.ts を参照。
//
// 現時点の実装対象は、パラメーター系（物攻・属攻・物防・属防・速度・会心）のアップ / ダウンと
// ダメージアップ系、ダメージ上限アップ系、耐性系。威力アップは別の概念として PowerUp* で扱う。

/**
 * ステータス効果の種別。アップ / ダウンを展開した 1 つの列挙として扱う。
 *
 * バフにしか無い種別やデバフにしか無い種別があるため、
 * 「パラメーター × 向き」の組み合わせではなく種別そのものを列挙する。
 * 各種別の属性（バフかデバフか、表示名、効果量の単位と既定の上限）は {@link StatusEffectKindDefinition} を
 * マスターデータとして持つ。
 */
export type StatusEffectKind =
  | DamageCapUpStatusEffectKind
  | DamageUpStatusEffectKind
  | ParameterStatusEffectKind
  | ResistanceDownStatusEffectKind
  | ResistanceUpStatusEffectKind;

/** パラメーター系（物攻・属攻・物防・属防・速度・会心）の種別。 */
export type ParameterStatusEffectKind =
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

/**
 * ダメージアップ系の種別。すべてバフ（対になるデバフが無い）。
 *
 * - 武器種別 8 種・属性別 6 種（例: `swordDamageUp` = 剣攻撃ダメージアップ、`iceDamageUp` = 氷属性ダメージアップ）
 * - `physicalDamageUp` … 全物理（「物理ダメージアップ」）
 * - `elementalDamageUp` … 全属性（「属性ダメージアップ」）
 * - `damageUp` … 全攻撃（説明文で単に「ダメージアップ」と書かれるもの。例: 踊子 モルルッソEX「盛りあげる」）。
 *   「物理・属性ダメージアップ」（例: 緋き断罪者「赤心のオーラ（全体）V」）は、
 *   `physicalDamageUp` と `elementalDamageUp` の 2 つを付与するものとして扱い、これには含めない
 * - 条件付き … `weaknessDamageUp`（弱点を突いた時）、`criticalDamageUp`（クリティカル時）、
 *   `breakDamageUp`（ブレイク中）
 *
 * 攻撃時にどの種別が掛かるかは {@link DamageUpKindDefinition} をマスターデータとして持つ。
 * 効果量の上限は種別ごとではなく「枠 × ダメージ計算の攻撃種別」ごとに掛かる。
 * 詳細なルールは lib/domain/statusEffect.ts を参照。
 */
export type DamageUpStatusEffectKind =
  | "axeDamageUp"
  | "bookDamageUp"
  | "bowDamageUp"
  | "breakDamageUp"
  | "criticalDamageUp"
  | "daggerDamageUp"
  | "damageUp"
  | "darkDamageUp"
  | "elementalDamageUp"
  | "fanDamageUp"
  | "fireDamageUp"
  | "iceDamageUp"
  | "lightDamageUp"
  | "lightningDamageUp"
  | "physicalDamageUp"
  | "spearDamageUp"
  | "staffDamageUp"
  | "swordDamageUp"
  | "weaknessDamageUp"
  | "windDamageUp";

/**
 * ダメージアップ系・ダメージ上限アップ系・耐性系の種別が掛かる攻撃種別。
 * 耐性系では、受ける攻撃の攻撃種別を表す。
 *
 * - `any` … 全攻撃。無属性攻撃にも掛かる
 * - `attackType` … 特定の武器種・属性の攻撃
 * - `elemental` … 全属性の攻撃
 * - `physical` … 全物理（全武器種）の攻撃
 */
export type StatusEffectAttackTarget =
  | { type: "any" }
  | { type: "attackType"; attackType: AttackType }
  | { type: "elemental" }
  | { type: "physical" };

/**
 * ダメージアップの発動条件。攻撃時に成立したものだけが合算・上限の対象になる。
 *
 * - `break` … 敵がブレイク中
 * - `critical` … クリティカル時
 * - `weakness` … 敵の弱点を突いた時。ダメージ計算の攻撃種別と、弱点を突いた攻撃種別は異なってもよい
 */
export type DamageUpCondition = "break" | "critical" | "weakness";

/** ダメージアップ系の種別の、攻撃時の合算に使うマスターデータ 1 件。 */
export type DamageUpKindDefinition = {
  kind: DamageUpStatusEffectKind;
  target: StatusEffectAttackTarget;
  /** 発動条件。無条件なら null。 */
  condition: DamageUpCondition | null;
};

/**
 * ダメージ上限アップ系の種別。すべてバフ（対になるデバフが無い）。
 *
 * 1 ヒットのダメージ上限（基本 99,999）を効果量だけ引き上げる。効果量は % ではなく絶対値
 * （例: 100000）で、合算に上限は無い。
 *
 * - `damageCapUp` … 全攻撃（説明文で単に「ダメージ上限アップ」と書かれるもの。
 *   例: リュック「バオール」）。無属性攻撃にも掛かる
 * - `physicalDamageCapUp` … 全物理
 * - `elementalDamageCapUp` … 全属性
 * - 武器種別 8 種・属性別 6 種（例: `swordDamageCapUp`、`iceDamageCapUp`）。
 *   「氷・風・光属性のいずれかで攻撃時 ダメージ上限アップ」（踊子 リンユウEX「大海の息吹」）のように
 *   複数の攻撃種別を列挙するものは、攻撃種別ごとに 1 つずつ別のステータス効果として付与する
 *
 * 攻撃時にどの種別が掛かるかは {@link DamageCapUpKindDefinition} をマスターデータとして持つ。
 * 詳細なルールは lib/domain/statusEffect.ts を参照。
 */
export type DamageCapUpStatusEffectKind =
  | "axeDamageCapUp"
  | "bookDamageCapUp"
  | "bowDamageCapUp"
  | "daggerDamageCapUp"
  | "damageCapUp"
  | "darkDamageCapUp"
  | "elementalDamageCapUp"
  | "fanDamageCapUp"
  | "fireDamageCapUp"
  | "iceDamageCapUp"
  | "lightDamageCapUp"
  | "lightningDamageCapUp"
  | "physicalDamageCapUp"
  | "spearDamageCapUp"
  | "staffDamageCapUp"
  | "swordDamageCapUp"
  | "windDamageCapUp";

/** ダメージ上限アップ系の種別の、攻撃時の合算に使うマスターデータ 1 件。 */
export type DamageCapUpKindDefinition = {
  kind: DamageCapUpStatusEffectKind;
  target: StatusEffectAttackTarget;
};

/**
 * 耐性アップ系の種別。すべてバフ。受ける攻撃のダメージを減らす。
 *
 * - 武器種別 8 種・属性別 6 種（例: `swordResistanceUp` = 剣耐性アップ、`iceResistanceUp` = 氷耐性アップ）。
 *   複数の攻撃種別を列挙するもの（耐性ダウンの例: 狂騒の愚者「満ちる叛意 灯火」の「槍・斧・闇耐性ダウン」）は、
 *   攻撃種別ごとに 1 つずつ別のステータス効果として付与する
 * - `physicalResistanceUp` … 全物理（「物理耐性アップ」）
 * - `elementalResistanceUp` … 全属性（「属性耐性アップ」。例: リュック「調合：バオール」）
 *
 * ダメージアップ系の全攻撃・条件付きに相当する種別は無い。
 * 攻撃を受けた時にどの種別が掛かるかは {@link ResistanceKindDefinition} をマスターデータとして持つ。
 * 効果量の上限は種別ごとではなく「枠 × 受ける攻撃のダメージ計算の攻撃種別」ごとに掛かる。
 * 詳細なルールは lib/domain/statusEffect.ts を参照。
 */
export type ResistanceUpStatusEffectKind =
  | "axeResistanceUp"
  | "bookResistanceUp"
  | "bowResistanceUp"
  | "daggerResistanceUp"
  | "darkResistanceUp"
  | "elementalResistanceUp"
  | "fanResistanceUp"
  | "fireResistanceUp"
  | "iceResistanceUp"
  | "lightResistanceUp"
  | "lightningResistanceUp"
  | "physicalResistanceUp"
  | "spearResistanceUp"
  | "staffResistanceUp"
  | "swordResistanceUp"
  | "windResistanceUp";

/**
 * 耐性ダウン系の種別。すべてデバフ。受ける攻撃のダメージを増やす。
 *
 * 構成は耐性アップ系（{@link ResistanceUpStatusEffectKind}）と同じ 16 種
 * （例: `spearResistanceDown` = 槍耐性ダウン、`physicalResistanceDown` = 物理耐性ダウン）。
 */
export type ResistanceDownStatusEffectKind =
  | "axeResistanceDown"
  | "bookResistanceDown"
  | "bowResistanceDown"
  | "daggerResistanceDown"
  | "darkResistanceDown"
  | "elementalResistanceDown"
  | "fanResistanceDown"
  | "fireResistanceDown"
  | "iceResistanceDown"
  | "lightResistanceDown"
  | "lightningResistanceDown"
  | "physicalResistanceDown"
  | "spearResistanceDown"
  | "staffResistanceDown"
  | "swordResistanceDown"
  | "windResistanceDown";

/** 耐性系（耐性アップ / 耐性ダウン）の種別。 */
export type ResistanceStatusEffectKind =
  ResistanceDownStatusEffectKind | ResistanceUpStatusEffectKind;

/**
 * 耐性系の種別の、攻撃を受けた時の合算に使うマスターデータ 1 件。
 *
 * `target` は受ける攻撃の攻撃種別を表す。全攻撃（`any`）を対象にする種別は無いため、型で除外している。
 */
export type ResistanceKindDefinition = {
  kind: ResistanceStatusEffectKind;
  target: Exclude<StatusEffectAttackTarget, { type: "any" }>;
};

/** バフ（強化効果）かデバフ（弱体効果）か。種別の属性であり、種別から決まる。 */
export type StatusEffectPolarity = "buff" | "debuff";

/**
 * ステータス効果の効果量の単位。
 *
 * - `absolute` … 絶対値（例: ダメージ上限アップの 100000）
 * - `percent` … %（例: 物攻アップの 15）
 */
export type StatusEffectMagnitudeUnit = "absolute" | "percent";

/** ステータス効果の種別のマスターデータ 1 件。 */
export type StatusEffectKindDefinition = {
  kind: StatusEffectKind;
  /** 日本語の表示名（例: 物攻アップ）。 */
  name: string;
  polarity: StatusEffectPolarity;
  /** 効果量の単位。 */
  magnitudeUnit: StatusEffectMagnitudeUnit;
  /**
   * 上限引き上げ効果が無いときの、1 つのまとまりの効果量の上限（単位は magnitudeUnit）。
   * 上限が無い種別は null で、上限引き上げ効果も指定できない。
   *
   * ダメージアップ系では、種別ごとのまとまりではなく「枠 × ダメージ計算の攻撃種別」の合算に掛かる。
   * 参照されるのは、武器種・属性の攻撃なら対応する武器種別・属性別の種別の値、
   * 無属性攻撃なら全攻撃（`damageUp`）の値で、全物理・全属性・条件付きの種別の値は参照されない。
   * 耐性系も同様に「枠 × 受ける攻撃のダメージ計算の攻撃種別」の合算に掛かり、参照されるのは
   * 対応する武器種別・属性別の種別の値。
   */
  defaultMagnitudeCap: number | null;
};

/**
 * バフ・デバフの「枠」。効果量の上限（パラメーター系・ダメージアップ系・耐性系は基本 30%）は枠ごとに別々に数える。
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
 * バフ・デバフ・威力アップの付与元。由来ごとのタグで、どのデータ種別の ID を参照するかが決まる。
 *
 * 「同じアビリティの重ね掛けでは効果量が増えない」判定と、ターン無し効果の取り除きに使う。
 * タグとすべてのメンバーが一致すれば同じ付与元になる。同名アビリティでも使用キャラが違えば
 * 別の付与元になる。アクティブアビリティとパッシブアビリティは ID の一意性をデータ種別の中で
 * 保証しているため、同じ `abilityId` でもタグが違えば別の付与元になる。
 * キャラクターのステータスを参照する効果のために、どの由来も `characterId` を持つ。
 *
 * 支援者・援魔石・神獣・支炎獣の由来は、それぞれのデータ種別を作るときにタグを追加する。
 *
 * メンバーの ASCII 順。
 */
export type StatusEffectSource =
  | {
      type: "activeAbility";
      /** 使用したキャラクターの ID。 */
      characterId: DataId;
      /** `lib/data/activeAbilities/` の ID。 */
      abilityId: DataId;
      /**
       * 同じキャラ・同じアビリティでも別の付与元として扱いたい場合の区別。
       *
       * 例: ティティの「猛将の鼓舞Ⅲ」は説明に「ブースト MAX 時重複可」とあり、ブースト MAX で
       * 使った場合とそれ以外で使った場合を重ね掛けできる。このようなアビリティをブースト MAX で
       * 使った場合に `"boostMax"` を指定すると、同じアビリティでも別の付与元として効果量が加算される。
       */
      variant?: string;
    }
  | {
      type: "equipment";
      /** 装備しているキャラクターの ID。 */
      characterId: DataId;
      /** 装備品の ID。装備品のデータ種別は未作成なので、当面は文字列として扱う。 */
      equipmentId: DataId;
    }
  | {
      type: "passiveAbility";
      /** アビリティを持つキャラクターの ID。 */
      characterId: DataId;
      /** `lib/data/passiveAbilities/` の ID。 */
      abilityId: DataId;
    };

/**
 * アビリティ等が 1 回の行動で付与するバフ・デバフ 1 件分の内容。
 */
export type StatusEffectApplication = {
  slot: StatusEffectSlot;
  kind: StatusEffectKind;
  /** 効果量。正の値。単位は種別ごとに決まる（{@link StatusEffectKindDefinition}）。 */
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
  /** 効果量。単位は種別ごとに決まる。 */
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
  /** ターン付き効果の効果量の合計。単位は種別ごとに決まる。切れるまで下がらない。 */
  timedMagnitude: number;
  /** ターン付き効果の残りターン数。現在のターンを含む。ターン付き効果が無ければ 0。 */
  remainingTurns: number;
  /** ターン付き効果として効果量を寄与した付与元。 */
  timedSources: StatusEffectSource[];
};

/**
 * 効果量の上限を引き上げる効果を 1 件付与する内容。
 *
 * 「サポアビと装備性能による物攻・属攻アップの上限が 60% になる効果」（リュック「アルベド族長の娘」、
 * ターン無し）や「バトルアビリティによる物防・属防ダウンを受けた際の上限が 50% になる効果」
 * （リュック「調合：ブラスターマイン」3 ターン、七英雄ロックブーケ「テンプテーション EX」2 ターン）
 * のように、「枠 × 種別」を指定して上限値を変える。
 * 「物攻・属攻アップ」のように複数の種別にかかる場合は、種別ごとに 1 件ずつ付与する。
 *
 * ダメージアップ系の上限は「枠 × ダメージ計算の攻撃種別」ごとに掛かるため、武器種別・属性別の
 * 種別（`swordDamageUp` など）を指定し、その攻撃種別の攻撃に対する合算の上限を表す。
 * 「サポアビと装備性能による物理ダメージアップの上限が 50%」（剣士 ヴィオラEX「神器の継承者」）は
 * 8 武器種の種別に 1 件ずつ、「剣攻撃ダメージアップの上限が 50%」は `swordDamageUp` に 1 件付与する。
 * 全物理・全属性・全攻撃・条件付きの種別は指定できない。
 *
 * 耐性系も同じく「枠 × 受ける攻撃のダメージ計算の攻撃種別」ごとに掛かるため、武器種別・属性別の
 * 種別を指定する。「バトアビによる / サポアビと装備性能による 槍・斧・闇耐性ダウンを受けた際の上限が
 * 60%」（狂騒の愚者「満ちる叛意 灯火」）は 3 種別 × 2 枠の 6 件、「サポアビと装備性能による
 * 属性耐性ダウンを受けた際の上限が 50%」（七英雄ロックブーケ「魅惑の誘い 灯火」）は属性 6 種の
 * 種別に 1 件ずつ付与する。全物理・全属性の種別は指定できない。
 *
 * 上限の無い種別（ダメージ上限アップ系）も指定できない。
 */
export type StatusEffectMagnitudeCapApplication = {
  slot: StatusEffectSlot;
  kind: StatusEffectKind;
  /** 引き上げ後の上限（%）。例: 50, 60。 */
  cap: number;
  duration: StatusEffectDuration;
  source: StatusEffectSource;
};

/** ある対象にかかっている、効果量の上限を引き上げる効果 1 件。 */
export type StatusEffectMagnitudeCap = {
  slot: StatusEffectSlot;
  kind: StatusEffectKind;
  /** 引き上げ後の上限（%）。 */
  cap: number;
  /** 残りターン数。現在のターンを含む。ターン無しなら null。 */
  remainingTurns: number | null;
  source: StatusEffectSource;
};

/** ある対象（味方 1 人または敵 1 体）にかかっているバフ・デバフ全体。 */
export type StatusEffectState = {
  /** 「枠 × 種別」ごとのバフ・デバフのまとまり。 */
  pools: readonly StatusEffectPool[];
  /** 効果量の上限を引き上げる効果。複数あれば最も高い上限が有効。 */
  magnitudeCaps: readonly StatusEffectMagnitudeCap[];
};

// --- 状態異常 -------------------------------------------------------------------
//
// 毒・麻痺・沈黙など。ステータス効果とは別の概念で、継続・重複・解除のロジックが異なる
// （例: 沈黙は再付与で使用不能アビリティを再抽選、睡眠は被ダメージで解除）。
// 種別の一覧は game8「状態効果の種類と効果」(https://game8.jp/octopathtraveler-sp/357235) と
// オクトラ書庫の旅人ページの表記に基づく（2026-11-08 時点）。
// 付与・継続・解除のロジックは未実装。ここでは種別とマスターデータの型だけを定義する。

/** 状態異常の種別。表示名は lib/domain/statusAilmentKind.ts のマスターデータを参照。 */
export type StatusAilmentKind =
  | "bleeding"
  | "blindness"
  | "burning"
  | "charm"
  | "corrosion"
  | "dizziness"
  | "electrification"
  | "fear"
  | "frostbite"
  | "heavyBleeding"
  | "painRage"
  | "paralysis"
  | "poison"
  | "provocation"
  | "saintHalo"
  | "severePoison"
  | "silence"
  | "sleep"
  | "spContamination"
  | "weakness";

/** 状態異常の種別のマスターデータ 1 件。 */
export type StatusAilmentKindDefinition = {
  kind: StatusAilmentKind;
  /** 日本語の表示名（例: 麻痺）。 */
  name: string;
  /** 敵にのみ付与される状態異常なら true。 */
  enemyOnly: boolean;
};

// --- 特殊効果 -------------------------------------------------------------------
//
// ステータス効果・状態異常のどちらにも属さない効果の総称。ゲーム内では
// 「自身に特殊効果 "一献" を付与」のようにアビリティ説明文で名指しされる。
// 基本的に治療・無効化できず、「強化効果延長」「異常効果延長」などの対象にもならない。
//
// 例:
// - キャラ固有のもの … 一献（カザン。物攻・属攻アップ 10%、使用条件や確率効果の起点になる）、
//   聖戦の祈り（リンユウ）、激情、強葬、威圧、行きがけの駄賃、碧海の叡智Ⅰ / Ⅱ、カモフラ、連撃
// - 敵から付与されるもの … 死の宣告、畏怖、昏睡、静寂、魅了、交代禁止、気力喪失
// - 敵が自身に付与するもの … かばう、シールド自動回復、対多段シールドロック、対弱点反撃
//
// キャラ固有のものが多く閉じた列挙にできないため、ID と名称を持つマスターデータとして表す。
// 継続・重複・解除のロジックは効果ごとに異なり、未実装。

/** 特殊効果のマスターデータ 1 件。 */
export type SpecialEffectDefinition = {
  /** 一意な ID（例: `"kazan:ikkon"`）。 */
  id: DataId;
  /** 日本語の表示名。ゲーム内のアビリティ説明文での名称（例: 一献）。 */
  name: string;
  /** キャラ固有の特殊効果なら、そのキャラクターの ID。 */
  characterId?: DataId;
};

// --- 威力アップ -----------------------------------------------------------------
//
// 攻撃アビリティの威力に掛かる倍率を上げる効果。アビリティ・必殺技・サポートアビリティ・
// 装備品から付与される。ステータス効果（バフ・デバフ）とは継続・重複・上限のルールが異なるため、
// 並列する別の概念として扱う。詳細なルールは lib/domain/powerUp.ts を参照。
//
// 例:
// - 神官 オズバルド EX「代償の魔術」 … バトアビ。味方単体に威力アップ 100%（2 ターン）
// - 七英雄ロックブーケ「パッションパフューム」 … 必殺技。味方前後衛全体に威力アップ 100%
// - 剣士 ヴィオラ EX「神器の神髄」 … サポアビ。BP1 以上消費時に自身に 100%、BP2 以上なら 150%
// - アーティファクト「火炎魔法の増幅器」 … 装備品。条件を満たすと自身に火属性の威力アップ 75%
// - 武器「煌く宙を堕とす狩王女Ⅳ」 … 装備品。自身に威力アップ 30%（重複可 = 加算）
//
// 敵に付与される「受ける攻撃の威力が増加」（深怨など）は別の概念で、ここには含めない。

/**
 * 威力アップの区分。説明文で「重複可」「加算」と明示されないものはすべて `base`。
 *
 * - `additive` … 加算。ベースとは独立に集計し、有効値をベースの有効値に足す
 * - `base` … ベース
 */
export type PowerUpStacking = "additive" | "base";

/**
 * 威力アップの対象となる攻撃種別。
 *
 * - `any` … 無条件。すべての攻撃に掛かる（無属性攻撃を含む）
 * - `attackType` … 特定の武器種・属性の攻撃にだけ掛かる（例: 火炎魔法の増幅器 = 火属性）
 *
 * `attackType` は {@link DamageAttackType} ではなく {@link AttackType} にしている。無属性を対象にする
 * 威力アップは確認できていないため。無属性攻撃に無条件の威力アップだけが掛かるという挙動は
 * この型に依存しているので、広げる場合は威力アップの参照関数の挙動も見直すこと。
 */
export type PowerUpTarget =
  { type: "any" } | { type: "attackType"; attackType: AttackType };

/**
 * アビリティ等が 1 回の行動で付与する威力アップ 1 件分の内容。
 *
 * 付与条件（BP 消費量、HP 満タンなど）の判定は呼び出し側で行い、付与されたものだけを渡す。
 */
export type PowerUpApplication = {
  /** 枠。ステータス効果と同じ区分を使う。装備品由来は `supportAbility`。 */
  slot: StatusEffectSlot;
  target: PowerUpTarget;
  stacking: PowerUpStacking;
  /** 効果量（%）。正の値。上限は無い。 */
  magnitude: number;
  duration: StatusEffectDuration;
  /** 付与元。ターン無し効果の差し替え・取り除きに使う。装備品由来は `type: "equipment"`。 */
  source: StatusEffectSource;
};

/** まとまりに含まれるターン無しの威力アップ 1 件。 */
export type PowerUpPermanentSource = {
  source: StatusEffectSource;
  /** 効果量（%）。 */
  magnitude: number;
};

/**
 * ある対象にかかっている、同じ「枠 × 対象の攻撃種別 × 区分」の威力アップのまとまり。
 *
 * まとまりの中では合算せず、効果量は高い方、残りターンは長い方が残る。
 */
export type PowerUpPool = {
  slot: StatusEffectSlot;
  target: PowerUpTarget;
  stacking: PowerUpStacking;
  /** ターン無し効果の一覧。 */
  permanentSources: PowerUpPermanentSource[];
  /** ターン付き効果の効果量（%）のうち最大のもの。切れるまで下がらない。無ければ 0。 */
  timedMagnitude: number;
  /** ターン付き効果の残りターン数のうち最長のもの。現在のターンを含む。無ければ 0。 */
  remainingTurns: number;
};

/** ある対象（味方 1 人）にかかっている威力アップ全体。 */
export type PowerUpState = {
  /** 「枠 × 対象の攻撃種別 × 区分」ごとの威力アップのまとまり。 */
  pools: readonly PowerUpPool[];
};

// =============================================================================
// 5. レシピ
// =============================================================================

// =============================================================================
// 6. 入出力・永続化
// =============================================================================
