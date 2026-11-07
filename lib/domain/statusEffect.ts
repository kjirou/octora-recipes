/**
 * バフ・デバフ（ステータス効果）に関するドメインロジック。
 *
 * ルールの出典は、オクトラ書庫「バフ・デバフについて」「よくあるご質問」および
 * game8「バフ・デバフの上限と重複の仕様」（いずれも二次情報）。
 *
 * 採用しているルール:
 *
 * - 効果量（%）は「枠 × 向き × 種類」のまとまり（{@link StatusEffectPool}）ごとに合算し、
 *   上限は基本 30%。枠が違えば別々に 30% まで積める。
 * - 同じ付与元（同キャラ・同アビリティ）を重ねても効果量は増えない。付与元が違えば加算する。
 *   例外として、支援者・援魔石のように同じ技でも重なるものは
 *   {@link StatusEffectApplication.stacksWithSameSource} で表す。
 * - 継続ターンは付与元が同じでも違っても合算し、上限は 9 ターン。
 * - 一度上がった効果量は、まとまり全体が切れるまで下がらない
 *   （15% と 20% を重ねて 30% になった後、15% 分だけが先に切れることはない）。
 * - 付与したターンを 1 ターン目として数え、ターン終了時に 1 減る。0 になったら消える。
 *
 * 枠ごとの効果量を最終的なダメージ倍率に合成する計算（枠・系統ごとの乗算）は
 * このモジュールの範囲外。
 */

import type {
  StatusEffectApplication,
  StatusEffectKind,
  StatusEffectPolarity,
  StatusEffectPool,
  StatusEffectSlot,
  StatusEffectState,
} from "@/lib/types";

/** 1 つのまとまりに積める効果量（%）の基本上限。 */
export const MAX_STATUS_EFFECT_MAGNITUDE = 30;

/** 1 つのまとまりの継続ターン数の上限。 */
export const MAX_STATUS_EFFECT_TURNS = 9;

export type ApplyStatusEffectOptions = {
  /**
   * 効果量の上限（%）。「上限を 50% にする」効果がかかっている対象に指定する。
   * 既定は {@link MAX_STATUS_EFFECT_MAGNITUDE}。
   */
  magnitudeCap?: number;
};

/** 2 つのバフ・デバフの種類が同じかを返す。 */
export const isSameStatusEffectKind = (
  a: StatusEffectKind,
  b: StatusEffectKind,
): boolean => {
  if (a.category === "parameter" && b.category === "parameter") {
    return a.parameter === b.parameter;
  }
  if (a.category === "resistance" && b.category === "resistance") {
    return a.attackType === b.attackType;
  }
  return false;
};

/** 指定した「枠 × 向き × 種類」のまとまりを返す。無ければ undefined。 */
export const findStatusEffectPool = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  polarity: StatusEffectPolarity,
  kind: StatusEffectKind,
): StatusEffectPool | undefined =>
  state.find(
    (pool) =>
      pool.slot === slot &&
      pool.polarity === polarity &&
      isSameStatusEffectKind(pool.kind, kind),
  );

/** 指定した「枠 × 向き × 種類」の現在の効果量（%）を返す。かかっていなければ 0。 */
export const getStatusEffectMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  polarity: StatusEffectPolarity,
  kind: StatusEffectKind,
): number => findStatusEffectPool(state, slot, polarity, kind)?.magnitude ?? 0;

/** 指定した「枠 × 向き × 種類」の残り継続ターン数を返す。かかっていなければ 0。 */
export const getStatusEffectRemainingTurns = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  polarity: StatusEffectPolarity,
  kind: StatusEffectKind,
): number =>
  findStatusEffectPool(state, slot, polarity, kind)?.remainingTurns ?? 0;

/**
 * バフ・デバフを 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 効果量・継続ターンが不正な値の場合は例外を投げる。
 */
export const applyStatusEffect = (
  state: StatusEffectState,
  application: StatusEffectApplication,
  options: ApplyStatusEffectOptions = {},
): StatusEffectState => {
  const {
    slot,
    polarity,
    kind,
    magnitude,
    turns,
    sourceKey,
    stacksWithSameSource = false,
  } = application;
  if (!(Number.isFinite(magnitude) && magnitude > 0)) {
    throw new Error(
      `効果量は正の数である必要があります: magnitude=${magnitude}`,
    );
  }
  if (!(Number.isInteger(turns) && turns >= 1)) {
    throw new Error(
      `継続ターンは 1 以上の整数である必要があります: turns=${turns}`,
    );
  }
  const magnitudeCap = options.magnitudeCap ?? MAX_STATUS_EFFECT_MAGNITUDE;

  const existing = findStatusEffectPool(state, slot, polarity, kind);
  if (existing === undefined) {
    return [
      ...state,
      {
        slot,
        polarity,
        kind,
        magnitude: Math.min(magnitude, magnitudeCap),
        remainingTurns: Math.min(turns, MAX_STATUS_EFFECT_TURNS),
        sourceKeys: [sourceKey],
      },
    ];
  }

  const isNewSource = !existing.sourceKeys.includes(sourceKey);
  const addsMagnitude = isNewSource || stacksWithSameSource;
  const updated: StatusEffectPool = {
    ...existing,
    magnitude: addsMagnitude
      ? Math.min(existing.magnitude + magnitude, magnitudeCap)
      : existing.magnitude,
    remainingTurns: Math.min(
      existing.remainingTurns + turns,
      MAX_STATUS_EFFECT_TURNS,
    ),
    sourceKeys: isNewSource
      ? [...existing.sourceKeys, sourceKey]
      : existing.sourceKeys,
  };
  return state.map((pool) => (pool === existing ? updated : pool));
};

/**
 * ターン終了時の処理を行った後の状態を返す。元の状態は変更しない。
 *
 * すべてのまとまりの残りターンを 1 減らし、0 になったものを取り除く。
 */
export const elapseStatusEffectTurn = (
  state: StatusEffectState,
): StatusEffectState =>
  state.flatMap((pool) => {
    const remainingTurns = pool.remainingTurns - 1;
    return remainingTurns <= 0 ? [] : [{ ...pool, remainingTurns }];
  });
