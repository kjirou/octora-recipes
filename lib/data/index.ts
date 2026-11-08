/**
 * 全データ種別の辞書と一覧をまとめたカタログ。
 *
 * ロジック側（lib/domain/ など）はデータ種別のモジュールを直接 import せず、
 * このカタログを引数で受け取る。
 */

import type { DataCatalog } from "@/lib/types";

import { abilityDataDict, abilityDataList } from "./abilities";
import { characterDataDict, characterDataList } from "./characters";

export const dataCatalog: DataCatalog = {
  abilityDataDict,
  abilityDataList,
  characterDataDict,
  characterDataList,
};
