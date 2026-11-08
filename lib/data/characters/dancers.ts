import type { CharacterDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクター。 */
export const dancerCharactersJson = [
  {
    id: "rocbouquet",
    name: "七英雄ロックブーケ",
    job: "dancer",
    influence: "power",
    rarity: 5,
    abilityDataIds: [
      "rocbouquet:temptationEx",
      "rocbouquet:alluringInvitationTomoshibi",
      "rocbouquet:passionPerfume",
    ],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type DancerCharacterDataId = (typeof dancerCharactersJson)[number]["id"];
