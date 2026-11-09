/**
 * lib/data/ のデータ定義のための共通ユーティリティ。
 */

/**
 * データの一覧から、指定したキーの値をキーにした辞書を作る。
 *
 * キーの値が重複している場合は後のものが残る。重複が無いことは各データ種別のテストで検査する。
 */
export const createDataDict = <
  Id extends string,
  T extends Readonly<Record<string, unknown>>,
>(
  list: ReadonlyArray<T>,
  key: keyof T,
): Readonly<Record<Id, T>> =>
  Object.fromEntries(list.map((item) => [item[key], item])) as Record<Id, T>;
