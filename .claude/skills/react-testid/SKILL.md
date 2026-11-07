---
name: react-testid
description: React コンポーネントに data-testid を付与する際のルール。付与判断・文字列規約・テスト参照パターンを含む。data-testid の付与・見直しをする時に使用する。
---

## data-testid の付与ルール

### 付与するかの判断 (3 段構造 + 判断順序)

次の順に見て振り分ける:

1. **同時に複数描画される可能性があるコンポーネントか** (`.map()` の中で使う使用例が 1 箇所でもあるか)
   - Yes → **カテゴリ 3**: props で識別 key を受け取り、data-testid に埋め込む
   - No → 2 へ
2. **画面上に単一しか存在しないランドマーク相当のコンポーネントか** (Page / Navigator / Dialog root / Notifier root など、ある時点の DOM に多くて 1 個)
   - Yes → **カテゴリ 1**: root DOM に固定の data-testid を付ける
   - No → 3 へ
3. **それ以外**
   - → **カテゴリ 2**: テスト (E2E / ユニット) が直接引きたい要素のみ、都度付ける

### 境界の定義

- 「画面に単一」: ある瞬間の DOM に多くて 1 個。表示/非表示が切り替わっても各時点で 0 or 1 ならカテゴリ 1
- 「複数描画される可能性」: `.map()` の中で使う使用例が 1 箇所でもあればカテゴリ 3
- Fragment (`<>...</>`) や条件で `null` を返すコンポーネントは対象外 (root DOM がないため)。テストから引きたい時は子要素側で個別対応 (カテゴリ 2 扱い)
  - 例外: カテゴリ 1 相当のランドマークで、かつラッパ要素を足してもレイアウトと重なり順が変わらないと確認できる場合に限り、`data-testid` を持たせるためだけの root div を新設してよい (子が全て `position: fixed` のダイアログレイヤーなど)。新設したラッパには `transform` 等の containing block を作るプロパティを持たせないこと
- HOC / memo / forwardRef でラップされていても、宣言名基準で内側の root DOM に付ける
- **外側ガードラッパと内側描画コンポーネントに分かれている場合**: 実際にレンダリング DOM を持つ内側コンポーネントに、**外側コンポーネント宣言名の kebab-case** で data-testid を付ける (`RecipePage` (guard) → `RecipePageInner` (content) の場合、Inner の root に `recipe-page`)。これはカテゴリ 1 の判定「画面に単一のランドマーク相当か」を outer + inner 全体で 1 つとして扱うため

## data-testid の文字列規約

### 変換ルール

- 文字列は **コンポーネント宣言名 (`const Foo = ...` / `function Foo(...)`) の kebab-case** をそのまま使う
  - `RecipePage` → `recipe-page`
  - `DialogRoot` → `dialog-root`
  - `PartyMember` → `party-member`
- 連続大文字は 1 語扱い
  - `URLDisplay` → `url-display`
  - `APIStatus` → `api-status`
- `displayName` プロパティではなく、宣言名を正とする (静的に grep 可能で機械的に決められるため)

### カテゴリ 3 の suffix

- props で `testKey: string` を受け取り、`{base}-{testKey}` の形で埋める
  - 例: `<PartyMember testKey={member.id} />` → `data-testid="party-member-{member.id}"`
- base 側 (コンポーネント宣言名) の書き換えは許さない。testid と宣言名が乖離すると機械性が崩れるため
- **testKey が省略された場合は data-testid 属性自体を emit しない**。カテゴリ 3 該当コンポーネントを常時テストで引く必要はないため

### カテゴリ 2 の命名

- コンポーネントではない素の DOM 要素に付けるため、宣言名だけでは決まらない。**`{所有コンポーネント宣言名の kebab-case}--{要素の役割}`** の形にする
  - 例: `RecipePage` 内の保存ボタン → `recipe-page--save-button`
  - 例: `Navigator` 内の Config ボタン → `navigator--config-button`
- 区切りはハイフン 2 個 (`--`)。カテゴリ 3 の `{base}-{testKey}` がハイフン 1 個なので、区切りを変えることで testid 単体を見たときにカテゴリ 2 なのか testKey 付きなのかを判別できる
  - 例: `party-member--hp` (カテゴリ 2 = HP 表示セル) と `party-member-0` (カテゴリ 3 = スロット 0) は同じ base だが取り違えない
- 付けるのは「表示テキストが無い (アイコンのみ)」「テキストが状態やデータで変わる」など、スコープ内の `getByRole` / `getByText` では安定して引けない要素に限る。文言がハードコードされたリテラルなら testid を足さず、ページ root の testid でスコープしてから `getByText` で引く

### 衝突の解決

- 同一 DOM 上に同じ base 名が共存しうる場合は、**コンポーネント名側をリネームして解決する** (`Header` → `HomeHeader` / `RecipeHeader` 等)
- testid にだけ prefix を足す抜け道は作らない。宣言名 = testid の対応を保つ
- **カテゴリ 3 で `testKey` が同一 DOM 上で重複しうる場合は、testid 側では解決しない**。参照側で祖先の testid にスコープしてから引く
  - 例: 「新着 N 件 + 全件」のように同じ value の行を 2 箇所に描く一覧では `{base}-{value}` が重複し、Playwright の strict mode に引っかかる
  - 重複しうるコンポーネントは JSDoc にその旨を書き、参照側は `getByTestId("dialog-item-0").getByTestId("selector-row-xxx")` のように上位でスコープを絞るか、狙う側の区画を特定してから引く
  - 「重複を避けるために testKey へ index を混ぜる」ことはしない。testKey が意味論的な ID でなくなると、参照側から何を指しているのか読めなくなるため

## テストでのセレクタ書き方 (推奨形)

E2E (Playwright) と React コンポーネントのユニットテスト (React Testing Library) いずれも、まず data-testid で要素を絞り込み、その内側で `getByRole` / `getByText` を使うのを基本形とする。

- `getByTestId`: 識別 (この画面の / この dialog の / この member の)
- `getByRole`: 意味論のアサーション (heading / button / dialog / listitem 等)
- `getByText`: スコープ内で表示テキストをアサート

Playwright の例:

```ts
const heading = page
  .getByTestId("recipe-page")
  .getByRole("heading", { level: 1 });
await expect(heading).toBeVisible();
```

React Testing Library の例:

```tsx
const page = screen.getByTestId("recipe-page");
expect(within(page).getByRole("heading", { level: 1 })).toBeVisible();
```

data-testid 単独でも識別 + 存在確認はできるが、role / text を組み合わせることで「その要素がロールとして公開されているか」「表示テキストが期待通りか」という副次的な保証を得られる。i18n テキストへの直接依存 (`getByText("...")` を root から使う) はテスト全体で避ける。
