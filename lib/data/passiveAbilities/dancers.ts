import type { PassiveAbilityDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクターが持つパッシブアビリティ。 */
export const dancerPassiveAbilitiesJson = [
  // --- 七英雄ロックブーケ ---
  {
    id: "dancer:shichieiyuurokkubuuke:alluringInvitationTomoshibi",
    name: "魅惑の誘い 灯火",
    category: "supportAbility",
  },
] as const satisfies ReadonlyArray<PassiveAbilityDataDef>;

export type DancerPassiveAbilityDataId =
  (typeof dancerPassiveAbilitiesJson)[number]["id"];
