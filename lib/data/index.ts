/**
 * 全データ種別の辞書と一覧をまとめたカタログ。
 *
 * ロジック側（lib/domain/ など）はデータ種別のモジュールを直接 import せず、
 * このカタログを引数で受け取る。
 */

import type { DataCatalog } from "@/lib/types";

import {
  activeAbilityDataDict,
  activeAbilityDataList,
} from "./activeAbilities";
import { characterDataDict, characterDataList } from "./characters";
import {
  passiveAbilityDataDict,
  passiveAbilityDataList,
} from "./passiveAbilities";

export const dataCatalog: DataCatalog = {
  activeAbilityDataDict,
  activeAbilityDataList,
  characterDataDict,
  characterDataList,
  passiveAbilityDataDict,
  passiveAbilityDataList,
};
