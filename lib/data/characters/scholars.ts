import type { CharacterDataDef } from "@/lib/types";

/** ジョブが学者のキャラクター。 */
export const scholarCharactersJson = [
  {
    id: "scholar:kazan",
    name: "カザン",
    job: "scholar",
    influence: "power",
    rarity: 5,
    activeAbilityDataIds: [
      "scholar:kazan:ikkon",
      "scholar:kazan:shukuen",
      "scholar:kazan:shisenHappenNoKei",
    ],
    passiveAbilityDataIds: [],
  },
  {
    id: "scholar:ryukku",
    name: "リュック",
    job: "scholar",
    influence: "wealth",
    rarity: 5,
    activeAbilityDataIds: [
      "scholar:ryukku:mixBlasterMine",
      "scholar:ryukku:mixBaoru",
      "scholar:ryukku:mixFinalElixir",
    ],
    passiveAbilityDataIds: ["scholar:ryukku:albedoChieftainsDaughter"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
