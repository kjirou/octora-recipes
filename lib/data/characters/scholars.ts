import type { CharacterDataDef } from "@/lib/types";

/** ジョブが学者のキャラクター。 */
export const scholarCharactersJson = [
  {
    id: "kazan",
    name: "カザン",
    job: "scholar",
    influence: "power",
    rarity: 5,
    abilityDataIds: ["kazan:ikkon", "kazan:shukuen", "kazan:shisenHappenNoKei"],
  },
  {
    id: "lueck",
    name: "リュック",
    job: "scholar",
    influence: "wealth",
    rarity: 5,
    abilityDataIds: [
      "lueck:mixBlasterMine",
      "lueck:mixBaoru",
      "lueck:albedoChieftainsDaughter",
      "lueck:mixFinalElixir",
    ],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
