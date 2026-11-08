/**
 * バフ・デバフ（ステータス効果）に関するドメインロジック。
 *
 * ルールの出典は、オクトラ書庫「バフ・デバフについて」「よくあるご質問」および
 * game8「バフ・デバフの上限と重複の仕様」（いずれも二次情報）。
 *
 * 採用しているルール:
 *
 * - 効果量は「枠 × 種別」のまとまり（{@link StatusEffectPool}）ごとに合算し、
 *   参照時に上限を適用する。効果量の単位（% / 絶対値）と上限引き上げ効果が無いときの上限は
 *   種別ごとにマスターデータで決まり、パラメーター系・ダメージアップ系・耐性系は 30%。枠が違えば別々に 30% まで積める。
 *   種別はアップ / ダウンを展開した列挙なので、物攻アップと物攻ダウンは別のまとまりになる
 *   （相殺はしない）。
 * - 上限は「枠 × 種別」を指定して引き上げる効果（{@link StatusEffectMagnitudeCap}）で変わる。
 *   複数かかっていれば最も高い上限が有効。効果量は上限を適用する前の生の値で持つので、
 *   上限が上がった瞬間に、それまで 30% を超えていた分も反映される。
 * - ターン無し効果とターン付き効果は同じまとまりに効果量を合算する
 *   （例: サポアビ枠でターン無し物攻 +10% とターン付き物攻 +15% なら、サポアビ枠として +25%）。
 * - ターン付き効果は、同じ付与元（同キャラ・同アビリティ）を重ねても効果量が増えない。
 *   付与元が違えば加算する。例外として、支援者・援魔石のように同じ技でも重なるものは
 *   {@link StatusEffectApplication.stacksWithSameSource} で表す。
 * - ターン付き効果の継続ターンは、付与元が同じでも違っても合算し、上限は 9 ターン。
 *   ターン無し効果はターンの合算に関与しない。
 * - 一度上がったターン付きの効果量は、ターン付き効果が切れるまで下がらない
 *   （15% と 20% を重ねて 30% になった後、15% 分だけが先に切れることはない）。
 * - 付与したターンを 1 ターン目として数え、ターン終了時に 1 減る。0 になったら
 *   ターン付き効果がまとめて消える。ターン無し効果は条件が外れたときに明示的に取り除く。
 * - 上限引き上げ効果同士の重ね掛けルールは資料に記載がないため、同じ付与元の再付与は
 *   残りターンの合算（上限 9）、別の付与元は別の効果として並存する扱いにしている。
 *
 * ダメージアップ系の種別（{@link DamageUpStatusEffectKind}）も、付与・継続ターン・重複のルールは
 * 上記と同じで、「枠 × 種別」のまとまりで管理する。全物理と剣のように種別が違えば継続ターンは別管理。
 * 効果量の上限だけが異なり、種別ごとではなく「枠 × ダメージ計算の攻撃種別」ごとに掛かる
 * （game8: 「各物理・属性ごとに合計で 30% までしか反映されません」）:
 *
 * - ある攻撃に対して、同じ枠の次の種別のまとまりを合算してから上限を掛ける。
 *   その攻撃の武器種 / 属性のダメージアップ、全物理（物理攻撃のとき）または全属性（属性攻撃のとき）、
 *   全攻撃、その攻撃で条件が成立した条件付きダメージアップ（弱点時・クリティカル時・ブレイク中）。
 * - 無属性攻撃には、全攻撃と条件付きのダメージアップだけが掛かる。
 * - 条件が成立していない条件付きダメージアップは上限を消費しない。
 * - 上限引き上げ効果は、その攻撃種別に対応する武器種別・属性別の種別（`swordDamageUp` など）を
 *   指定したもので表す。無属性攻撃の上限を引き上げる効果は確認できていないため、
 *   無属性攻撃の上限は常に既定値として扱っている（資料に基づくルールではなく実装上の仮定）。
 *
 * そのためダメージアップ系の効果量は {@link getStatusEffectMagnitude} ではなく
 * {@link getDamageUpMagnitude} で参照する。
 *
 * ダメージ上限アップ系の種別（{@link DamageCapUpStatusEffectKind}）も、付与・継続ターン・重複のルールは
 * 上記と同じで、「枠 × 種別」のまとまりで管理する。パラメーター系との違いは次のとおり:
 *
 * - 効果量は % ではなく絶対値（例: 100000）。1 ヒットのダメージ上限（基本 99,999）への加算量を表す。
 * - 合算に上限は無い。上限引き上げ効果も指定できない。
 * - ある攻撃に対して、同じ枠の次の種別のまとまりを合算する（ダメージアップ系と同じ構造で、
 *   上限は掛けない）。全攻撃、全物理（物理攻撃のとき）または全属性（属性攻撃のとき）、
 *   その攻撃の武器種 / 属性のダメージ上限アップ。無属性攻撃には全攻撃のものだけが掛かる。
 *
 * そのためダメージ上限アップ系の効果量は {@link getDamageCapUpMagnitude} で参照する。
 * 枠をまたいだ合算と、基本上限 99,999 への加算による最終的なダメージ上限の算出は範囲外。
 *
 * 耐性系の種別（{@link ResistanceStatusEffectKind}）も、
 * 付与・継続ターン・重複のルールは上記と同じで、「枠 × 種別」のまとまりで管理する。
 * 全物理と槍のように種別が違えば継続ターンは別管理（game8: 「効果量は上記 8 種と重複、ターン数は別管理」）。
 * 攻撃を受ける側の状態として、効果量の上限はダメージアップ系と同じく
 * 「枠 × 受ける攻撃のダメージ計算の攻撃種別」ごとに掛かる:
 *
 * - ある攻撃を受けるとき、同じ枠の次の種別のまとまりを合算してから上限を掛ける。
 *   その攻撃の武器種 / 属性の耐性、全物理（物理攻撃のとき）または全属性（属性攻撃のとき）の耐性。
 *   耐性アップと耐性ダウンは別々に合算する。
 * - 無属性攻撃にはどの耐性も掛からない。
 * - 上限引き上げ効果は、その攻撃種別に対応する武器種別・属性別の種別（`spearResistanceDown` など）を
 *   指定したもので表す。
 * - オクトラ書庫 FAQ には「耐性アップだけサポアビと装備で分かれています」とあるが、
 *   サポアビと装備性能は他の種別と同じく `supportAbility` 枠として扱う
 *   （https://github.com/kjirou/octora-recipes/issues/18 ）。
 *
 * そのため耐性系の効果量は {@link getResistanceMagnitude} で参照する。
 *
 * 枠ごとの効果量を最終的なダメージ倍率に合成する計算は、このモジュールの範囲外。
 */

import type {
  AttackType,
  DamageAttackType,
  DamageCapUpStatusEffectKind,
  DamageUpCondition,
  DamageUpStatusEffectKind,
  ParameterStatusEffectKind,
  ResistanceStatusEffectKind,
  StatusEffectApplication,
  StatusEffectAttackTarget,
  StatusEffectKind,
  StatusEffectMagnitudeCap,
  StatusEffectMagnitudeCapApplication,
  StatusEffectPolarity,
  StatusEffectPool,
  StatusEffectSlot,
  StatusEffectSource,
  StatusEffectState,
  Weapon,
} from "@/lib/types";

import {
  DAMAGE_UP_KIND_DEFINITIONS,
  RESISTANCE_KIND_DEFINITIONS,
  getAttackTypeDamageUpKind,
  getAttackTypeResistanceKind,
  getStatusEffectKindDefinition,
  getStatusEffectPolarity,
  isDamageUpStatusEffectKind,
  isResistanceStatusEffectKind,
  listDamageCapUpKindDefinitions,
  listDamageUpKindDefinitions,
  listResistanceKindDefinitions,
} from "./statusEffectKind";

/** 1 つのまとまりの継続ターン数の上限。 */
export const MAX_STATUS_EFFECT_TURNS = 9;

/** 何もかかっていない状態を返す。 */
export const createEmptyStatusEffectState = (): StatusEffectState => ({
  pools: [],
  magnitudeCaps: [],
});

/** 2 つの付与元が同じかを返す。キャラ・アビリティ・区別がすべて一致すれば同じ。 */
export const isSameStatusEffectSource = (
  a: StatusEffectSource,
  b: StatusEffectSource,
): boolean =>
  a.characterId === b.characterId &&
  a.abilityId === b.abilityId &&
  a.variant === b.variant;

/** 指定した「枠 × 種別」のまとまりを返す。無ければ undefined。 */
export const findStatusEffectPool = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): StatusEffectPool | undefined =>
  state.pools.find((pool) => pool.slot === slot && pool.kind === kind);

/**
 * 指定した「枠 × 種別」に現在有効な効果量の上限を返す。上限の無い種別なら null。
 *
 * 上限引き上げ効果が無ければ、種別の既定の上限
 * （{@link StatusEffectKindDefinition.defaultMagnitudeCap}）。複数あれば最も高い値。
 */
export const getStatusEffectMagnitudeCap = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): number | null => {
  const { defaultMagnitudeCap } = getStatusEffectKindDefinition(kind);
  if (defaultMagnitudeCap === null) {
    return null;
  }
  return state.magnitudeCaps
    .filter(
      (magnitudeCap) =>
        magnitudeCap.slot === slot && magnitudeCap.kind === kind,
    )
    .reduce(
      (cap, magnitudeCap) => Math.max(cap, magnitudeCap.cap),
      defaultMagnitudeCap,
    );
};

/** 効果量に上限を適用した値を返す。上限が null なら効果量をそのまま返す。 */
const capMagnitude = (magnitude: number, cap: number | null): number =>
  cap === null ? magnitude : Math.min(magnitude, cap);

/** まとまりの、上限を適用する前の効果量を返す。ターン無し・ターン付きの合計。 */
const getRawPoolMagnitude = (pool: StatusEffectPool): number =>
  pool.permanentSources.reduce(
    (sum, permanentSource) => sum + permanentSource.magnitude,
    pool.timedMagnitude,
  );

/**
 * 指定した「枠 × 種別」の現在の効果量（%）を返す。かかっていなければ 0。
 *
 * ターン無し・ターン付きの効果量を合計し、現在有効な上限を適用した値を返す。
 * ダメージアップ系の種別は上限の単位が違うため受け付けない。{@link getDamageUpMagnitude} を使う。
 * 耐性系の種別も同様に受け付けない。{@link getResistanceMagnitude} を使う。
 * ダメージ上限アップ系の種別も受け付けない。{@link getDamageCapUpMagnitude} を使う。
 */
export const getStatusEffectMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: ParameterStatusEffectKind,
): number => {
  const pool = findStatusEffectPool(state, slot, kind);
  if (pool === undefined) {
    return 0;
  }
  return capMagnitude(
    getRawPoolMagnitude(pool),
    getStatusEffectMagnitudeCap(state, slot, kind),
  );
};

const WEAPONS: Record<Weapon, true> = {
  axe: true,
  book: true,
  bow: true,
  dagger: true,
  fan: true,
  spear: true,
  staff: true,
  sword: true,
};

const isWeapon = (attackType: AttackType): attackType is Weapon =>
  Object.hasOwn(WEAPONS, attackType);

/**
 * ダメージアップ系・ダメージ上限アップ系・耐性系の種別の対象が、指定した攻撃種別の攻撃を含むかを返す。
 * ダメージアップ系の発動条件は見ない。
 */
const coversDamageAttackType = (
  target: StatusEffectAttackTarget,
  attackType: DamageAttackType,
): boolean => {
  switch (target.type) {
    case "any":
      return true;
    case "attackType":
      return target.attackType === attackType;
    case "elemental":
      return attackType !== "nonElemental" && !isWeapon(attackType);
    case "physical":
      return attackType !== "nonElemental" && isWeapon(attackType);
  }
};

/**
 * ある攻撃に掛かるダメージアップ系の種別を返す。
 *
 * @param attackType ダメージ計算に使う攻撃種別
 * @param conditions その攻撃で成立している発動条件
 */
export const listApplicableDamageUpKinds = (
  attackType: DamageAttackType,
  conditions: readonly DamageUpCondition[],
): DamageUpStatusEffectKind[] =>
  listDamageUpKindDefinitions()
    .filter(
      (definition) =>
        coversDamageAttackType(definition.target, attackType) &&
        (definition.condition === null ||
          conditions.includes(definition.condition)),
    )
    .map((definition) => definition.kind);

/**
 * 指定した枠について、ある攻撃に掛かるダメージアップの効果量（%）を返す。かかっていなければ 0。
 *
 * その攻撃に掛かる種別（{@link listApplicableDamageUpKinds}）のまとまりの効果量を合算し、
 * 「枠 × 攻撃種別」の上限を適用した値を返す。上限は、武器種・属性の攻撃なら対応する
 * 武器種別・属性別の種別の上限（{@link getStatusEffectMagnitudeCap}）、無属性攻撃なら
 * 全攻撃（`damageUp`）の既定の上限。
 *
 * @param attackType ダメージ計算に使う攻撃種別。弱点を突いた攻撃種別とは異なってもよい
 * @param conditions その攻撃で成立している発動条件（弱点を突いた・クリティカル・ブレイク中）
 */
export const getDamageUpMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  attackType: DamageAttackType,
  conditions: readonly DamageUpCondition[],
): number =>
  sumAndCapPoolMagnitudes(
    state,
    slot,
    listApplicableDamageUpKinds(attackType, conditions),
    // 全攻撃（damageUp）は上限引き上げ効果を指定できないので、無属性攻撃の上限は常に既定値になる。
    attackType === "nonElemental"
      ? "damageUp"
      : getAttackTypeDamageUpKind(attackType),
  );

/** 指定した種別のまとまりの効果量（上限を適用する前）を合算する。 */
const sumRawPoolMagnitudes = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kinds: readonly StatusEffectKind[],
): number =>
  kinds
    .map((kind) => findStatusEffectPool(state, slot, kind))
    .reduce(
      (sum, pool) => sum + (pool === undefined ? 0 : getRawPoolMagnitude(pool)),
      0,
    );

/**
 * 指定した種別のまとまりの効果量を合算し、`capKind` の「枠 × 種別」に現在有効な上限
 * （{@link getStatusEffectMagnitudeCap}）を適用した値を返す。
 *
 * ダメージアップ系・耐性系のように、上限が「枠 × 攻撃種別」ごとに掛かる種別の参照に使う。
 * `capKind` には、その攻撃種別に対応する武器種別・属性別の種別を渡す。
 */
const sumAndCapPoolMagnitudes = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kinds: readonly StatusEffectKind[],
  capKind: StatusEffectKind,
): number =>
  capMagnitude(
    sumRawPoolMagnitudes(state, slot, kinds),
    getStatusEffectMagnitudeCap(state, slot, capKind),
  );

/**
 * ある攻撃に掛かるダメージ上限アップ系の種別を返す。
 *
 * @param attackType ダメージ計算に使う攻撃種別
 */
export const listApplicableDamageCapUpKinds = (
  attackType: DamageAttackType,
): DamageCapUpStatusEffectKind[] =>
  listDamageCapUpKindDefinitions()
    .filter((definition) =>
      coversDamageAttackType(definition.target, attackType),
    )
    .map((definition) => definition.kind);

/**
 * 指定した枠について、ある攻撃に掛かるダメージ上限アップの効果量（絶対値）を返す。
 * かかっていなければ 0。
 *
 * その攻撃に掛かる種別（{@link listApplicableDamageCapUpKinds}）のまとまりの効果量を合算した値を返す。
 * 上限は掛けない。
 *
 * @param attackType ダメージ計算に使う攻撃種別。弱点を突いた攻撃種別とは異なってもよい
 */
export const getDamageCapUpMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  attackType: DamageAttackType,
): number =>
  sumRawPoolMagnitudes(state, slot, listApplicableDamageCapUpKinds(attackType));

/**
 * ある攻撃を受けるときに掛かる耐性系の種別を返す。
 *
 * @param attackType 受ける攻撃のダメージ計算に使う攻撃種別
 * @param polarity `buff` なら耐性アップ、`debuff` なら耐性ダウン
 */
export const listApplicableResistanceKinds = (
  attackType: DamageAttackType,
  polarity: StatusEffectPolarity,
): ResistanceStatusEffectKind[] =>
  listResistanceKindDefinitions()
    .filter(
      (definition) =>
        getStatusEffectPolarity(definition.kind) === polarity &&
        coversDamageAttackType(definition.target, attackType),
    )
    .map((definition) => definition.kind);

/**
 * 指定した枠について、ある攻撃を受けるときに掛かる耐性アップまたは耐性ダウンの効果量（%）を返す。
 * かかっていなければ 0。
 *
 * その攻撃に掛かる種別（{@link listApplicableResistanceKinds}）のまとまりの効果量を合算し、
 * 「枠 × 攻撃種別」の上限を適用した値を返す。上限は、対応する武器種別・属性別の種別の上限
 * （{@link getStatusEffectMagnitudeCap}）。無属性攻撃にはどの耐性も掛からないので常に 0。
 *
 * @param attackType 受ける攻撃のダメージ計算に使う攻撃種別。弱点を突いた攻撃種別とは異なってもよい
 * @param polarity `buff` なら耐性アップ、`debuff` なら耐性ダウン
 */
export const getResistanceMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  attackType: DamageAttackType,
  polarity: StatusEffectPolarity,
): number =>
  attackType === "nonElemental"
    ? 0
    : sumAndCapPoolMagnitudes(
        state,
        slot,
        listApplicableResistanceKinds(attackType, polarity),
        getAttackTypeResistanceKind(attackType, polarity),
      );

/** 指定した「枠 × 種別」のターン付き効果の残りターン数を返す。無ければ 0。 */
export const getStatusEffectRemainingTurns = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): number => findStatusEffectPool(state, slot, kind)?.remainingTurns ?? 0;

/** ターン無し・ターン付きのどちらの効果も残っていないまとまりか。 */
const isEmptyStatusEffectPool = (pool: StatusEffectPool): boolean =>
  pool.permanentSources.length === 0 && pool.remainingTurns === 0;

/** まとまりを差し替える、または無ければ末尾に追加した状態を返す。 */
const replaceStatusEffectPool = (
  state: StatusEffectState,
  existing: StatusEffectPool | undefined,
  updated: StatusEffectPool,
): StatusEffectState => ({
  ...state,
  pools:
    existing === undefined
      ? [...state.pools, updated]
      : state.pools.map((pool) => (pool === existing ? updated : pool)),
});

const assertValidMagnitude = (magnitude: number, label: string): void => {
  if (!(Number.isFinite(magnitude) && magnitude > 0)) {
    throw new Error(`${label}は正の数である必要があります: ${magnitude}`);
  }
};

const assertValidTurns = (turns: number): void => {
  if (!(Number.isInteger(turns) && turns >= 1)) {
    throw new Error(
      `継続ターンは 1 以上の整数である必要があります: turns=${turns}`,
    );
  }
};

/**
 * バフ・デバフを 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 効果量・継続ターンが不正な値の場合は例外を投げる。
 */
export const applyStatusEffect = (
  state: StatusEffectState,
  application: StatusEffectApplication,
): StatusEffectState => {
  const {
    slot,
    kind,
    magnitude,
    duration,
    source,
    stacksWithSameSource = false,
  } = application;
  assertValidMagnitude(magnitude, "効果量");
  if (duration.type === "turns") {
    assertValidTurns(duration.turns);
  }

  const existing = findStatusEffectPool(state, slot, kind);
  const base: StatusEffectPool = existing ?? {
    slot,
    kind,
    permanentSources: [],
    timedMagnitude: 0,
    remainingTurns: 0,
    timedSources: [],
  };

  if (duration.type === "permanent") {
    // 同じ付与元のターン無し効果は 1 件だけ保持する（再付与は差し替え）。
    const hasSameSource = base.permanentSources.some((permanentSource) =>
      isSameStatusEffectSource(permanentSource.source, source),
    );
    const permanentSources = hasSameSource
      ? base.permanentSources.map((permanentSource) =>
          isSameStatusEffectSource(permanentSource.source, source)
            ? { source, magnitude }
            : permanentSource,
        )
      : [...base.permanentSources, { source, magnitude }];
    return replaceStatusEffectPool(state, existing, {
      ...base,
      permanentSources,
    });
  }

  const isNewSource = !base.timedSources.some((timedSource) =>
    isSameStatusEffectSource(timedSource, source),
  );
  const addsMagnitude = isNewSource || stacksWithSameSource;
  return replaceStatusEffectPool(state, existing, {
    ...base,
    timedMagnitude: addsMagnitude
      ? base.timedMagnitude + magnitude
      : base.timedMagnitude,
    remainingTurns: Math.min(
      base.remainingTurns + duration.turns,
      MAX_STATUS_EFFECT_TURNS,
    ),
    timedSources: isNewSource
      ? [...base.timedSources, source]
      : base.timedSources,
  });
};

/**
 * 効果量の上限を引き上げる効果を 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 同じ「枠 × 種別 × 付与元」の効果が既にあれば、上限値を差し替え、ターン付きなら残りターンを
 * 合算する（上限 9）。付与元が違えば別の効果として並存し、参照時に最も高い上限が使われる。
 * 上限が正の数でない、継続ターンが不正な場合、ダメージアップ系のうち武器種別・属性別
 * 以外の種別（全物理・全属性・全攻撃・条件付き）を指定した場合、耐性系のうち武器種別・属性別
 * 以外の種別（全物理・全属性）を指定した場合、または上限の無い種別（ダメージ上限アップ系）を
 * 指定した場合は例外を投げる。
 */
export const applyStatusEffectMagnitudeCap = (
  state: StatusEffectState,
  application: StatusEffectMagnitudeCapApplication,
): StatusEffectState => {
  const { slot, kind, cap, duration, source } = application;
  assertValidMagnitude(cap, "上限");
  if (getStatusEffectKindDefinition(kind).defaultMagnitudeCap === null) {
    throw new Error(
      `上限の無い種別には上限引き上げ効果を指定できません: kind=${kind}`,
    );
  }
  if (
    isDamageUpStatusEffectKind(kind) &&
    DAMAGE_UP_KIND_DEFINITIONS[kind].target.type !== "attackType"
  ) {
    throw new Error(
      `ダメージアップ系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=${kind}`,
    );
  }
  if (
    isResistanceStatusEffectKind(kind) &&
    RESISTANCE_KIND_DEFINITIONS[kind].target.type !== "attackType"
  ) {
    throw new Error(
      `耐性系の上限引き上げは武器種別・属性別の種別にのみ指定できます: kind=${kind}`,
    );
  }
  if (duration.type === "turns") {
    assertValidTurns(duration.turns);
  }

  const existing = state.magnitudeCaps.find(
    (magnitudeCap) =>
      magnitudeCap.slot === slot &&
      magnitudeCap.kind === kind &&
      isSameStatusEffectSource(magnitudeCap.source, source),
  );
  const remainingTurns =
    duration.type === "permanent"
      ? null
      : Math.min(
          (existing?.remainingTurns ?? 0) + duration.turns,
          MAX_STATUS_EFFECT_TURNS,
        );
  const updated: StatusEffectMagnitudeCap = {
    slot,
    kind,
    cap,
    remainingTurns,
    source,
  };
  return {
    ...state,
    magnitudeCaps:
      existing === undefined
        ? [...state.magnitudeCaps, updated]
        : state.magnitudeCaps.map((magnitudeCap) =>
            magnitudeCap === existing ? updated : magnitudeCap,
          ),
  };
};

/**
 * 指定した付与元のターン無し効果（バフ・デバフと上限引き上げの両方）をすべて取り除いた
 * 状態を返す。元の状態は変更しない。
 *
 * 「前衛時物攻アップ」のキャラが後衛に下がったときなど、条件が外れたときに使う。
 * ターン付き効果には影響しない。
 */
export const removePermanentStatusEffect = (
  state: StatusEffectState,
  source: StatusEffectSource,
): StatusEffectState => ({
  pools: state.pools.flatMap((pool) => {
    const permanentSources = pool.permanentSources.filter(
      (permanentSource) =>
        !isSameStatusEffectSource(permanentSource.source, source),
    );
    if (permanentSources.length === pool.permanentSources.length) {
      return [pool];
    }
    const updated: StatusEffectPool = { ...pool, permanentSources };
    return isEmptyStatusEffectPool(updated) ? [] : [updated];
  }),
  magnitudeCaps: state.magnitudeCaps.filter(
    (magnitudeCap) =>
      !(
        magnitudeCap.remainingTurns === null &&
        isSameStatusEffectSource(magnitudeCap.source, source)
      ),
  ),
});

/**
 * ターン終了時の処理を行った後の状態を返す。元の状態は変更しない。
 *
 * ターン付き効果の残りターンを 1 減らし、0 になったまとまりからターン付き効果を取り除く。
 * ターン無し効果だけになったまとまりは残り、何も残らないまとまりは取り除かれる。
 * 上限引き上げ効果も同様に残りターンを 1 減らし、0 になったものを取り除く。
 */
export const elapseStatusEffectTurn = (
  state: StatusEffectState,
): StatusEffectState => ({
  pools: state.pools.flatMap((pool) => {
    if (pool.remainingTurns === 0) {
      return [pool];
    }
    const remainingTurns = pool.remainingTurns - 1;
    const updated: StatusEffectPool =
      remainingTurns === 0
        ? { ...pool, timedMagnitude: 0, remainingTurns: 0, timedSources: [] }
        : { ...pool, remainingTurns };
    return isEmptyStatusEffectPool(updated) ? [] : [updated];
  }),
  magnitudeCaps: state.magnitudeCaps.flatMap((magnitudeCap) => {
    if (magnitudeCap.remainingTurns === null) {
      return [magnitudeCap];
    }
    const remainingTurns = magnitudeCap.remainingTurns - 1;
    return remainingTurns === 0 ? [] : [{ ...magnitudeCap, remainingTurns }];
  }),
});
