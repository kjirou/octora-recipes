import type { CharacterDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクター。 */
export const dancerCharactersJson = [
  {
    id: "rocbouquet",
    name: "七英雄ロックブーケ",
    job: "dancer",
    influence: "power",
    rarity: 5,
    activeAbilityDataIds: [
      "rocbouquet:temptationEx",
      "rocbouquet:passionPerfume",
    ],
    passiveAbilityDataIds: ["rocbouquet:alluringInvitationTomoshibi"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type DancerCharacterDataId = (typeof dancerCharactersJson)[number]["id"];
