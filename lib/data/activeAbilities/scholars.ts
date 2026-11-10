import type { ActiveAbilityDataDef } from "@/lib/types";

/** ジョブが学者のキャラクターが持つアクティブアビリティ。 */
export const scholarActiveAbilitiesJson = [
  // --- カザン ---
  {
    id: "scholar:kazan:ikkon",
    name: "一献",
    category: "battleAbility",
  },
  {
    id: "scholar:kazan:shukuen",
    name: "祝宴",
    category: "battleAbility",
  },
  {
    id: "scholar:kazan:shisenhappennokei",
    name: "四旋八焔の計",
    category: "ultimate",
  },
  // --- リュック ---
  {
    id: "scholar:ryukku:chougouburasutaamain",
    name: "調合：ブラスターマイン",
    category: "battleAbility",
  },
  {
    id: "scholar:ryukku:chougoubaooru",
    name: "調合：バオール",
    category: "battleAbility",
  },
  {
    id: "scholar:ryukku:chougoufainaruerikusaa",
    name: "調合：ファイナルエリクサー",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<ActiveAbilityDataDef>;

export type ScholarActiveAbilityDataId =
  (typeof scholarActiveAbilitiesJson)[number]["id"];
