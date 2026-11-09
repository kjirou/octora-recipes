import type { ActiveAbilityDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクターが持つアクティブアビリティ。 */
export const dancerActiveAbilitiesJson = [
  // --- 七英雄ロックブーケ ---
  {
    id: "rocbouquet:temptationEx",
    name: "テンプテーション ＥＸ",
    category: "exAbility",
  },
  {
    id: "rocbouquet:passionPerfume",
    name: "パッションパフューム",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<ActiveAbilityDataDef>;

export type DancerActiveAbilityDataId =
  (typeof dancerActiveAbilitiesJson)[number]["id"];
