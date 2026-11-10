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
      "scholar:kazan:shisenhappennokei",
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
      "scholar:ryukku:chougouburasutaamain",
      "scholar:ryukku:chougoubaooru",
      "scholar:ryukku:chougoufainaruerikusaa",
    ],
    passiveAbilityDataIds: ["scholar:ryukku:arubedozokuchounomusume"],
  },
] as const satisfies ReadonlyArray<CharacterDataDef>;

export type ScholarCharacterDataId =
  (typeof scholarCharactersJson)[number]["id"];
