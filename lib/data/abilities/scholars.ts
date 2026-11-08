import type { AbilityDataDef } from "@/lib/types";

/** ジョブが学者のキャラクターが持つアビリティ。 */
export const scholarAbilitiesJson = [
  // --- カザン ---
  {
    id: "kazan:ikkon",
    name: "一献",
    category: "battleAbility",
  },
  {
    id: "kazan:shukuen",
    name: "祝宴",
    category: "battleAbility",
  },
  {
    id: "kazan:shisen_happen_no_kei",
    name: "四旋八焔の計",
    category: "ultimate",
  },
  // --- リュック ---
  {
    id: "lueck:mix_blaster_mine",
    name: "調合：ブラスターマイン",
    category: "battleAbility",
  },
  {
    id: "lueck:mix_baoru",
    name: "調合：バオール",
    category: "battleAbility",
  },
  {
    id: "lueck:albedo_chieftains_daughter",
    name: "アルベド族長の娘",
    category: "supportAbility",
  },
  {
    id: "lueck:mix_final_elixir",
    name: "調合：ファイナルエリクサー",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<AbilityDataDef>;

export type ScholarAbilityDataId = (typeof scholarAbilitiesJson)[number]["id"];
