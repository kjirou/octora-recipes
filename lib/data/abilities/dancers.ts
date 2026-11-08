import type { AbilityDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクターが持つアビリティ。 */
export const dancerAbilitiesJson = [
  // --- 七英雄ロックブーケ ---
  {
    id: "rocbouquet:temptation_ex",
    name: "テンプテーション ＥＸ",
    category: "exAbility",
  },
  {
    id: "rocbouquet:alluring_invitation_tomoshibi",
    name: "魅惑の誘い 灯火",
    category: "supportAbility",
  },
  {
    id: "rocbouquet:passion_perfume",
    name: "パッションパフューム",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<AbilityDataDef>;

export type DancerAbilityDataId = (typeof dancerAbilitiesJson)[number]["id"];
