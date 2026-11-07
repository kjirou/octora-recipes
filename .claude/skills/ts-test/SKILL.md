---
name: ts-test
description: TypeScriptのテストケースを作成・更新する際のルール。テストの新規作成やリファクタリングを依頼された時に使用する。
---

# TypeScript テスト作成ルール

TypeScript のテストケースを作成・更新する際は、以下のルールに従うこと。

## テスト形式の優先順位

以下の順に優先して選択する。引数が複雑等の理由で上位の形式が難しければ、下位を選択してもよい。

1. **Table Driven Test** — `test.each` を使い、`name`, `args`, `expected` の3プロパティで構成する
2. **Parameterized Test** — `test.each` を使い、`name` の他は自由なプロパティを設定可能
3. **通常のテストケース** — `it` / `test` を並べる形式

## Table Driven Test の型定義パターン

```ts
describe("functionName", () => {
  test.each<{
    name: string;
    args: Parameters<typeof functionName>; // 引数が複数の場合
    expected: ReturnType<typeof functionName>;
  }>([{ name: "ケース説明", args: [arg1, arg2], expected: expectedValue }])(
    "$name",
    ({ args, expected }) => {
      expect(functionName(...args)).toBe(expected);
    },
  );
});
```

- 引数がオブジェクト1つの関数の場合は `args: Parameters<typeof fn>[0]` とし、呼び出しは `fn(args)` にする
- `expected` の型は `ReturnType<typeof fn>` を基本とする
- `args` の型は `Parameters<typeof fn>` を基本とする

## アサーション

- `toEqual` より `toStrictEqual` を優先して使うことを検討する
- プリミティブ値の比較には `toBe` を使う

## 命名・構造

- テストケース名が文章の場合は日本語で書くこと
- 基本的には関数別に `describe` でくくる
- `describe` の順序は本体の関数定義順に合わせる
- 必要なら関数名ではない単位で `describe` を作ってもよい
