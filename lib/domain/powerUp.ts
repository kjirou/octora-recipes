/**
 * 威力アップに関するドメインロジック。
 *
 * 威力アップはステータス効果（バフ・デバフ）と並列する別の概念で、継続・重複・上限のルールが
 * 異なる。ルールの出典はオクトラ書庫の旅人ページ・game8 の装備品ページの説明文（いずれも二次情報）。
 *
 * 採用しているルール:
 *
 * - 「枠 × 対象の攻撃種別 × 区分（ベース / 加算）」のまとまり（{@link PowerUpPool}）ごとに管理する。
 * - まとまりの中では合算しない。効果量は高い方、残りターンは長い方が残る。
 *   「ターン延長不可」はこの挙動を指す。ターン無し効果とターン付き効果も、高い方が有効。
 * - 効果量に上限は無い。
 * - ターン無し効果は付与元ごとに 1 件だけ保持し、再付与は差し替える
 *   （「神器の神髄」のように BP 消費量で効果量が変わるものは、同じ付与元の効果量が変わっただけとする）。
 * - 付与したターンを 1 ターン目として数え、ターン終了時に 1 減る。0 になったらターン付き効果が消える。
 * - ある攻撃に有効な値は、その攻撃に該当するまとまり（無条件 + その攻撃種別）について、
 *   区分ごとに枠を問わず最大値を取り、ベースの最大値と加算の最大値を足したもの。
 * - 攻撃種別はダメージ計算に使う攻撃種別（無属性を含む）で受け取る。無属性攻撃には無条件の
 *   威力アップだけが掛かる。これは資料（オクトラ書庫・game8 など）で確認できていない実装上の
 *   仮定で、威力アップの説明文が攻撃種別を限定していないことに基づく。
 *
 * 付与条件（BP 消費量・HP 満タンなど）の判定と、ダメージ倍率への合成はこのモジュールの範囲外。
 */

import type {
  DamageAttackType,
  PowerUpApplication,
  PowerUpPool,
  PowerUpStacking,
  PowerUpState,
  PowerUpTarget,
  StatusEffectSlot,
  StatusEffectSource,
} from "@/lib/types";

import { isSameStatusEffectSource } from "./statusEffect";

/** 何もかかっていない状態を返す。 */
export const createEmptyPowerUpState = (): PowerUpState => ({ pools: [] });

/** 2 つの対象の攻撃種別が同じかを返す。 */
export const isSamePowerUpTarget = (
  a: PowerUpTarget,
  b: PowerUpTarget,
): boolean => {
  if (a.type === "any" || b.type === "any") {
    return a.type === b.type;
  }
  return a.attackType === b.attackType;
};

/**
 * 対象の攻撃種別が、指定した攻撃種別の攻撃に掛かるかを返す。
 *
 * 無属性攻撃には無条件の威力アップだけが掛かる（武器種・属性を対象にするものは掛からない）。
 */
const coversAttackType = (
  target: PowerUpTarget,
  attackType: DamageAttackType,
): boolean => target.type === "any" || target.attackType === attackType;

/** 指定した「枠 × 対象の攻撃種別 × 区分」のまとまりを返す。無ければ undefined。 */
export const findPowerUpPool = (
  state: PowerUpState,
  slot: StatusEffectSlot,
  target: PowerUpTarget,
  stacking: PowerUpStacking,
): PowerUpPool | undefined =>
  state.pools.find(
    (pool) =>
      pool.slot === slot &&
      isSamePowerUpTarget(pool.target, target) &&
      pool.stacking === stacking,
  );

/** まとまりの現在の効果量（%）を返す。ターン無し・ターン付きのうち最大の値。 */
const getPoolMagnitude = (pool: PowerUpPool): number =>
  pool.permanentSources.reduce(
    (max, permanentSource) => Math.max(max, permanentSource.magnitude),
    pool.timedMagnitude,
  );

/**
 * 指定した「枠 × 対象の攻撃種別 × 区分」のまとまりの現在の効果量（%）を返す。
 * かかっていなければ 0。
 */
export const getPowerUpPoolMagnitude = (
  state: PowerUpState,
  slot: StatusEffectSlot,
  target: PowerUpTarget,
  stacking: PowerUpStacking,
): number => {
  const pool = findPowerUpPool(state, slot, target, stacking);
  return pool === undefined ? 0 : getPoolMagnitude(pool);
};

/**
 * 指定した攻撃種別の攻撃について、指定した区分の有効な効果量（%）を返す。
 *
 * 無条件のまとまりと、その攻撃種別のまとまりから、枠を問わず最大値を取る。
 */
export const getPowerUpMagnitudeByStacking = (
  state: PowerUpState,
  attackType: DamageAttackType,
  stacking: PowerUpStacking,
): number =>
  state.pools
    .filter(
      (pool) =>
        pool.stacking === stacking && coversAttackType(pool.target, attackType),
    )
    .reduce((max, pool) => Math.max(max, getPoolMagnitude(pool)), 0);

/**
 * 指定した攻撃種別の攻撃に有効な威力アップの効果量（%）を返す。
 *
 * ベースの有効値と加算の有効値の和。
 */
export const getEffectivePowerUpMagnitude = (
  state: PowerUpState,
  attackType: DamageAttackType,
): number =>
  getPowerUpMagnitudeByStacking(state, attackType, "base") +
  getPowerUpMagnitudeByStacking(state, attackType, "additive");

/** ターン無し・ターン付きのどちらの効果も残っていないまとまりか。 */
const isEmptyPowerUpPool = (pool: PowerUpPool): boolean =>
  pool.permanentSources.length === 0 && pool.remainingTurns === 0;

/**
 * 威力アップを 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 効果量・継続ターンが不正な値の場合は例外を投げる。
 */
export const applyPowerUp = (
  state: PowerUpState,
  application: PowerUpApplication,
): PowerUpState => {
  const { slot, target, stacking, magnitude, duration, source } = application;
  if (!(Number.isFinite(magnitude) && magnitude > 0)) {
    throw new Error(`効果量は正の数である必要があります: ${magnitude}`);
  }
  if (
    duration.type === "turns" &&
    !(Number.isInteger(duration.turns) && duration.turns >= 1)
  ) {
    throw new Error(
      `継続ターンは 1 以上の整数である必要があります: turns=${duration.turns}`,
    );
  }

  const existing = findPowerUpPool(state, slot, target, stacking);
  const base: PowerUpPool = existing ?? {
    slot,
    target,
    stacking,
    permanentSources: [],
    timedMagnitude: 0,
    remainingTurns: 0,
  };

  let updated: PowerUpPool;
  if (duration.type === "permanent") {
    // 同じ付与元のターン無し効果は 1 件だけ保持する（再付与は差し替え）。
    const hasSameSource = base.permanentSources.some((permanentSource) =>
      isSameStatusEffectSource(permanentSource.source, source),
    );
    updated = {
      ...base,
      permanentSources: hasSameSource
        ? base.permanentSources.map((permanentSource) =>
            isSameStatusEffectSource(permanentSource.source, source)
              ? { source, magnitude }
              : permanentSource,
          )
        : [...base.permanentSources, { source, magnitude }],
    };
  } else {
    updated = {
      ...base,
      timedMagnitude: Math.max(base.timedMagnitude, magnitude),
      remainingTurns: Math.max(base.remainingTurns, duration.turns),
    };
  }

  return {
    ...state,
    pools:
      existing === undefined
        ? [...state.pools, updated]
        : state.pools.map((pool) => (pool === existing ? updated : pool)),
  };
};

/**
 * 指定した付与元のターン無し効果をすべて取り除いた状態を返す。元の状態は変更しない。
 *
 * 付与条件が外れたときに使う。ターン付き効果には影響しない。
 */
export const removePermanentPowerUp = (
  state: PowerUpState,
  source: StatusEffectSource,
): PowerUpState => ({
  ...state,
  pools: state.pools.flatMap((pool) => {
    const permanentSources = pool.permanentSources.filter(
      (permanentSource) =>
        !isSameStatusEffectSource(permanentSource.source, source),
    );
    if (permanentSources.length === pool.permanentSources.length) {
      return [pool];
    }
    const updated: PowerUpPool = { ...pool, permanentSources };
    return isEmptyPowerUpPool(updated) ? [] : [updated];
  }),
});

/**
 * ターン終了時の処理を行った後の状態を返す。元の状態は変更しない。
 *
 * ターン付き効果の残りターンを 1 減らし、0 になったまとまりからターン付き効果を取り除く。
 * 何も残らないまとまりは取り除かれる。
 */
export const elapsePowerUpTurn = (state: PowerUpState): PowerUpState => ({
  ...state,
  pools: state.pools.flatMap((pool) => {
    if (pool.remainingTurns === 0) {
      return [pool];
    }
    const remainingTurns = pool.remainingTurns - 1;
    const updated: PowerUpPool =
      remainingTurns === 0
        ? { ...pool, timedMagnitude: 0, remainingTurns: 0 }
        : { ...pool, remainingTurns };
    return isEmptyPowerUpPool(updated) ? [] : [updated];
  }),
});
