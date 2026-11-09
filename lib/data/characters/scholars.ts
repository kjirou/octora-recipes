import type { CharacterDataDef } from "@/lib/types";

/** ジョブが学者のキャラクター。 */
export const scholarCharactersJson = [
  {
    id: "kazan",
    name: "カザン",
    job: "scholar",
    influence: "power",
    rarity: 5,
    activeAbilityDataIds: [
      "kazan:ikkon",
      "kazan:shukuen",
      "kazan:shisenHappenNoKei",
    ],
    passiveAbilityDataIds: [],
  },
  {
    id: "ryukku",
    name: "リュック",
    job: "scholar",
    influence: "wealth",
    rarity: 5,
    activeAbilityDataIds: [
      "ryukku:mixBlasterMine",
      "ryukku:mixBaoru",
      "ryukku:mixFinalElixir",
    ],
    passiveAbilityDataIds: ["ryukku:albedoChieftainsDaughter"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
