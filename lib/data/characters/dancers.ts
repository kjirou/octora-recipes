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
      "dancer:shichieiyuurokkubuuke:tenputeeshon",
      "dancer:shichieiyuurokkubuuke:passhonpafyuumu",
    ],
    passiveAbilityDataIds: ["dancer:shichieiyuurokkubuuke:miwakunoizanai"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type DancerCharacterDataId = (typeof dancerCharactersJson)[number]["id"];
