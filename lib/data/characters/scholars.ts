import type { CharacterDataDef } from "@/lib/types";

/** ジョブが学者のキャラクター。 */
export const scholarCharactersJson = [
  {
    id: "kazan",
    name: "カザン",
    job: "scholar",
    influence: "power",
    rarity: 5,
    abilityDataIds: [
      "kazan:ikkon",
      "kazan:shukuen",
      "kazan:shisen_happen_no_kei",
    ],
  },
  {
    id: "lueck",
    name: "リュック",
    job: "scholar",
    influence: "wealth",
    rarity: 5,
    abilityDataIds: [
      "lueck:mix_blaster_mine",
      "lueck:mix_baoru",
      "lueck:albedo_chieftains_daughter",
      "lueck:mix_final_elixir",
    ],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
