/**
 * lib/data/ のデータ定義を静的に走査するテスト用ヘルパー。
 *
 * データ種別ごとのテストで同じ検査をするときは、各テストへコピーせずここに置いて共有する。
 * コピーすると、片方だけ検査の網がずれるため。
 */

/** 一覧の中で 2 回目以降に現れた値を、現れた順に返す。重複が無ければ空配列。 */
export const findDuplicates = (values: readonly string[]): string[] =>
  values.filter((value, index) => values.indexOf(value) !== index);
