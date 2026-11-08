import type { PassiveAbilityDataDef } from "@/lib/types";

/** ジョブが学者のキャラクターが持つパッシブアビリティ。 */
export const scholarPassiveAbilitiesJson = [
  // --- リュック ---
  {
    id: "lueck:albedoChieftainsDaughter",
    name: "アルベド族長の娘",
    category: "supportAbility",
  },
] as const satisfies ReadonlyArray<PassiveAbilityDataDef>;

export type ScholarPassiveAbilityDataId =
  (typeof scholarPassiveAbilitiesJson)[number]["id"];
