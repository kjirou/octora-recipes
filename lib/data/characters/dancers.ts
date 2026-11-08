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
      "rocbouquet:temptation_ex",
      "rocbouquet:alluring_invitation_tomoshibi",
      "rocbouquet:passion_perfume",
    ],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type DancerCharacterDataId = (typeof dancerCharactersJson)[number]["id"];
