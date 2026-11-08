import type { AbilityDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクターが持つアビリティ。 */
export const dancerAbilitiesJson = [
  // --- 七英雄ロックブーケ ---
  {
    id: "rocbouquet:temptationEx",
    name: "テンプテーション ＥＸ",
    category: "exAbility",
  },
  {
    id: "rocbouquet:alluringInvitationTomoshibi",
    name: "魅惑の誘い 灯火",
    category: "supportAbility",
  },
  {
    id: "rocbouquet:passionPerfume",
    name: "パッションパフューム",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<AbilityDataDef>;

export type DancerAbilityDataId = (typeof dancerAbilitiesJson)[number]["id"];
