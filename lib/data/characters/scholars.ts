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
    id: "lueck",
    name: "リュック",
    job: "scholar",
    influence: "wealth",
    rarity: 5,
    activeAbilityDataIds: [
      "lueck:mixBlasterMine",
      "lueck:mixBaoru",
      "lueck:mixFinalElixir",
    ],
    passiveAbilityDataIds: ["lueck:albedoChieftainsDaughter"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
