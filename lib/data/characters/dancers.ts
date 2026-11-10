import type { CharacterDataDef } from "@/lib/types";

/** ジョブが踊子のキャラクター。 */
export const dancerCharactersJson = [
  {
    id: "dancer:shichieiyuurokkubuuke",
    name: "七英雄ロックブーケ",
    job: "dancer",
    influence: "power",
    rarity: 5,
    activeAbilityDataIds: [
      "dancer:shichieiyuurokkubuuke:temptationEx",
      "dancer:shichieiyuurokkubuuke:passionPerfume",
    ],
    passiveAbilityDataIds: [
      "dancer:shichieiyuurokkubuuke:alluringInvitationTomoshibi",
    ],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type DancerCharacterDataId = (typeof dancerCharactersJson)[number]["id"];
