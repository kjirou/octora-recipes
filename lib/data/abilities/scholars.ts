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
    id: "kazan:shisenHappenNoKei",
    name: "四旋八焔の計",
    category: "ultimate",
  },
  // --- リュック ---
  {
    id: "lueck:mixBlasterMine",
    name: "調合：ブラスターマイン",
    category: "battleAbility",
  },
  {
    id: "lueck:mixBaoru",
    name: "調合：バオール",
    category: "battleAbility",
  },
  {
    id: "lueck:albedoChieftainsDaughter",
    name: "アルベド族長の娘",
    category: "supportAbility",
  },
  {
    id: "lueck:mixFinalElixir",
    name: "調合：ファイナルエリクサー",
    category: "ultimate",
  },
] as const satisfies ReadonlyArray<AbilityDataDef>;

export type ScholarAbilityDataId = (typeof scholarAbilitiesJson)[number]["id"];
