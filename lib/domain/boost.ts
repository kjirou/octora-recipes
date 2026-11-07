/**
 * ブースト / BP に関するドメインロジック。
 *
 * ゲームルールの前提は CLAUDE.md の「ブースト / BP」を参照。
 */

import type { BoostLevel } from "@/lib/types";

/** 保持できる BP の最大値。 */
export const MAX_BP = 5;

/** ターン開始時に自然回復する BP の量。 */
export const BP_RECOVERY_PER_TURN = 1;

/**
 * ブースト段階ごとの消費 BP を返す。
 *
 * なし / ×2 / ×3 / MAX がそれぞれ 0 / 1 / 2 / 3 を消費する。
 */
export const getBoostBpCost = (level: BoostLevel): number => level;

/** 現在の BP でそのブースト段階を選択できるかを返す。 */
export const canBoost = (currentBp: number, level: BoostLevel): boolean =>
  getBoostBpCost(level) <= currentBp;

/**
 * あるターンに指定のブースト段階で行動した場合の、次ターン開始時の BP を返す。
 *
 * - ブーストしなかったターンの次は BP が 1 自然回復する（上限 MAX_BP）
 * - ブーストしたターンの次は自然回復しない
 *
 * BP が不足していてそのブースト段階を選択できない場合は例外を投げる。
 */
export const calculateBpAtNextTurnStart = (
  currentBp: number,
  level: BoostLevel,
): number => {
  if (!canBoost(currentBp, level)) {
    throw new Error(
      `BP が不足しています: currentBp=${currentBp}, level=${level}`,
    );
  }
  const remaining = currentBp - getBoostBpCost(level);
  if (level > 0) {
    return remaining;
  }
  return Math.min(remaining + BP_RECOVERY_PER_TURN, MAX_BP);
};
