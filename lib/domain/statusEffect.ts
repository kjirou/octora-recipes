/**
 * バフ・デバフ（ステータス効果）に関するドメインロジック。
 *
 * ルールの出典は、オクトラ書庫「バフ・デバフについて」「よくあるご質問」および
 * game8「バフ・デバフの上限と重複の仕様」（いずれも二次情報）。
 *
 * 採用しているルール:
 *
 * - 効果量（%）は「枠 × 種別」のまとまり（{@link StatusEffectPool}）ごとに合算し、
 *   参照時に上限（基本 30%）を適用する。枠が違えば別々に 30% まで積める。
 *   種別はアップ / ダウンを展開した列挙なので、物攻アップと物攻ダウンは別のまとまりになる
 *   （相殺はしない）。
 * - 上限は「枠 × 種別」を指定して引き上げる効果（{@link StatusEffectMagnitudeCap}）で変わる。
 *   複数かかっていれば最も高い上限が有効。効果量は上限を適用する前の生の値で持つので、
 *   上限が上がった瞬間に、それまで 30% を超えていた分も反映される。
 * - ターン無し効果とターン付き効果は同じまとまりに効果量を合算する
 *   （例: サポアビ枠でターン無し物攻 +10% とターン付き物攻 +15% なら、サポアビ枠として +25%）。
 * - ターン付き効果は、同じ付与元（同キャラ・同アビリティ）を重ねても効果量が増えない。
 *   付与元が違えば加算する。例外として、支援者・援魔石のように同じ技でも重なるものは
 *   {@link StatusEffectApplication.stacksWithSameSource} で表す。
 * - ターン付き効果の継続ターンは、付与元が同じでも違っても合算し、上限は 9 ターン。
 *   ターン無し効果はターンの合算に関与しない。
 * - 一度上がったターン付きの効果量は、ターン付き効果が切れるまで下がらない
 *   （15% と 20% を重ねて 30% になった後、15% 分だけが先に切れることはない）。
 * - 付与したターンを 1 ターン目として数え、ターン終了時に 1 減る。0 になったら
 *   ターン付き効果がまとめて消える。ターン無し効果は条件が外れたときに明示的に取り除く。
 * - 上限引き上げ効果同士の重ね掛けルールは資料に記載がないため、同じ付与元の再付与は
 *   残りターンの合算（上限 9）、別の付与元は別の効果として並存する扱いにしている。
 *
 * 枠ごとの効果量を最終的なダメージ倍率に合成する計算は、このモジュールの範囲外。
 */

import type {
  StatusEffectApplication,
  StatusEffectKind,
  StatusEffectMagnitudeCap,
  StatusEffectMagnitudeCapApplication,
  StatusEffectPool,
  StatusEffectSlot,
  StatusEffectSource,
  StatusEffectState,
} from "@/lib/types";

/** 上限引き上げ効果が無いときの、1 つのまとまりの効果量（%）の上限。 */
export const DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP = 30;

/** 1 つのまとまりの継続ターン数の上限。 */
export const MAX_STATUS_EFFECT_TURNS = 9;

/** 何もかかっていない状態を返す。 */
export const createEmptyStatusEffectState = (): StatusEffectState => ({
  pools: [],
  magnitudeCaps: [],
});

/** 2 つの付与元が同じかを返す。キャラ・アビリティ・区別がすべて一致すれば同じ。 */
export const isSameStatusEffectSource = (
  a: StatusEffectSource,
  b: StatusEffectSource,
): boolean =>
  a.characterId === b.characterId &&
  a.abilityId === b.abilityId &&
  a.variant === b.variant;

/** 指定した「枠 × 種別」のまとまりを返す。無ければ undefined。 */
export const findStatusEffectPool = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): StatusEffectPool | undefined =>
  state.pools.find((pool) => pool.slot === slot && pool.kind === kind);

/**
 * 指定した「枠 × 種別」に現在有効な効果量の上限（%）を返す。
 *
 * 上限引き上げ効果が無ければ {@link DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP}。
 * 複数あれば最も高い値。
 */
export const getStatusEffectMagnitudeCap = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): number =>
  state.magnitudeCaps
    .filter(
      (magnitudeCap) =>
        magnitudeCap.slot === slot && magnitudeCap.kind === kind,
    )
    .reduce(
      (cap, magnitudeCap) => Math.max(cap, magnitudeCap.cap),
      DEFAULT_STATUS_EFFECT_MAGNITUDE_CAP,
    );

/**
 * 指定した「枠 × 種別」の現在の効果量（%）を返す。かかっていなければ 0。
 *
 * ターン無し・ターン付きの効果量を合計し、現在有効な上限を適用した値を返す。
 */
export const getStatusEffectMagnitude = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): number => {
  const pool = findStatusEffectPool(state, slot, kind);
  if (pool === undefined) {
    return 0;
  }
  const permanentMagnitude = pool.permanentSources.reduce(
    (sum, permanentSource) => sum + permanentSource.magnitude,
    0,
  );
  return Math.min(
    permanentMagnitude + pool.timedMagnitude,
    getStatusEffectMagnitudeCap(state, slot, kind),
  );
};

/** 指定した「枠 × 種別」のターン付き効果の残りターン数を返す。無ければ 0。 */
export const getStatusEffectRemainingTurns = (
  state: StatusEffectState,
  slot: StatusEffectSlot,
  kind: StatusEffectKind,
): number => findStatusEffectPool(state, slot, kind)?.remainingTurns ?? 0;

/** ターン無し・ターン付きのどちらの効果も残っていないまとまりか。 */
const isEmptyStatusEffectPool = (pool: StatusEffectPool): boolean =>
  pool.permanentSources.length === 0 && pool.remainingTurns === 0;

/** まとまりを差し替える、または無ければ末尾に追加した状態を返す。 */
const replaceStatusEffectPool = (
  state: StatusEffectState,
  existing: StatusEffectPool | undefined,
  updated: StatusEffectPool,
): StatusEffectState => ({
  ...state,
  pools:
    existing === undefined
      ? [...state.pools, updated]
      : state.pools.map((pool) => (pool === existing ? updated : pool)),
});

const assertValidMagnitude = (magnitude: number, label: string): void => {
  if (!(Number.isFinite(magnitude) && magnitude > 0)) {
    throw new Error(`${label}は正の数である必要があります: ${magnitude}`);
  }
};

const assertValidTurns = (turns: number): void => {
  if (!(Number.isInteger(turns) && turns >= 1)) {
    throw new Error(
      `継続ターンは 1 以上の整数である必要があります: turns=${turns}`,
    );
  }
};

/**
 * バフ・デバフを 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 効果量・継続ターンが不正な値の場合は例外を投げる。
 */
export const applyStatusEffect = (
  state: StatusEffectState,
  application: StatusEffectApplication,
): StatusEffectState => {
  const {
    slot,
    kind,
    magnitude,
    duration,
    source,
    stacksWithSameSource = false,
  } = application;
  assertValidMagnitude(magnitude, "効果量");
  if (duration.type === "turns") {
    assertValidTurns(duration.turns);
  }

  const existing = findStatusEffectPool(state, slot, kind);
  const base: StatusEffectPool = existing ?? {
    slot,
    kind,
    permanentSources: [],
    timedMagnitude: 0,
    remainingTurns: 0,
    timedSources: [],
  };

  if (duration.type === "permanent") {
    // 同じ付与元のターン無し効果は 1 件だけ保持する（再付与は差し替え）。
    const hasSameSource = base.permanentSources.some((permanentSource) =>
      isSameStatusEffectSource(permanentSource.source, source),
    );
    const permanentSources = hasSameSource
      ? base.permanentSources.map((permanentSource) =>
          isSameStatusEffectSource(permanentSource.source, source)
            ? { source, magnitude }
            : permanentSource,
        )
      : [...base.permanentSources, { source, magnitude }];
    return replaceStatusEffectPool(state, existing, {
      ...base,
      permanentSources,
    });
  }

  const isNewSource = !base.timedSources.some((timedSource) =>
    isSameStatusEffectSource(timedSource, source),
  );
  const addsMagnitude = isNewSource || stacksWithSameSource;
  return replaceStatusEffectPool(state, existing, {
    ...base,
    timedMagnitude: addsMagnitude
      ? base.timedMagnitude + magnitude
      : base.timedMagnitude,
    remainingTurns: Math.min(
      base.remainingTurns + duration.turns,
      MAX_STATUS_EFFECT_TURNS,
    ),
    timedSources: isNewSource
      ? [...base.timedSources, source]
      : base.timedSources,
  });
};

/**
 * 効果量の上限を引き上げる効果を 1 件付与した後の状態を返す。元の状態は変更しない。
 *
 * 同じ「枠 × 種別 × 付与元」の効果が既にあれば、上限値を差し替え、ターン付きなら残りターンを
 * 合算する（上限 9）。付与元が違えば別の効果として並存し、参照時に最も高い上限が使われる。
 * 上限が正の数でない、または継続ターンが不正な場合は例外を投げる。
 */
export const applyStatusEffectMagnitudeCap = (
  state: StatusEffectState,
  application: StatusEffectMagnitudeCapApplication,
): StatusEffectState => {
  const { slot, kind, cap, duration, source } = application;
  assertValidMagnitude(cap, "上限");
  if (duration.type === "turns") {
    assertValidTurns(duration.turns);
  }

  const existing = state.magnitudeCaps.find(
    (magnitudeCap) =>
      magnitudeCap.slot === slot &&
      magnitudeCap.kind === kind &&
      isSameStatusEffectSource(magnitudeCap.source, source),
  );
  const remainingTurns =
    duration.type === "permanent"
      ? null
      : Math.min(
          (existing?.remainingTurns ?? 0) + duration.turns,
          MAX_STATUS_EFFECT_TURNS,
        );
  const updated: StatusEffectMagnitudeCap = {
    slot,
    kind,
    cap,
    remainingTurns,
    source,
  };
  return {
    ...state,
    magnitudeCaps:
      existing === undefined
        ? [...state.magnitudeCaps, updated]
        : state.magnitudeCaps.map((magnitudeCap) =>
            magnitudeCap === existing ? updated : magnitudeCap,
          ),
  };
};

/**
 * 指定した付与元のターン無し効果（バフ・デバフと上限引き上げの両方）をすべて取り除いた
 * 状態を返す。元の状態は変更しない。
 *
 * 「前衛時物攻アップ」のキャラが後衛に下がったときなど、条件が外れたときに使う。
 * ターン付き効果には影響しない。
 */
export const removePermanentStatusEffect = (
  state: StatusEffectState,
  source: StatusEffectSource,
): StatusEffectState => ({
  pools: state.pools.flatMap((pool) => {
    const permanentSources = pool.permanentSources.filter(
      (permanentSource) =>
        !isSameStatusEffectSource(permanentSource.source, source),
    );
    if (permanentSources.length === pool.permanentSources.length) {
      return [pool];
    }
    const updated: StatusEffectPool = { ...pool, permanentSources };
    return isEmptyStatusEffectPool(updated) ? [] : [updated];
  }),
  magnitudeCaps: state.magnitudeCaps.filter(
    (magnitudeCap) =>
      !(
        magnitudeCap.remainingTurns === null &&
        isSameStatusEffectSource(magnitudeCap.source, source)
      ),
  ),
});

/**
 * ターン終了時の処理を行った後の状態を返す。元の状態は変更しない。
 *
 * ターン付き効果の残りターンを 1 減らし、0 になったまとまりからターン付き効果を取り除く。
 * ターン無し効果だけになったまとまりは残り、何も残らないまとまりは取り除かれる。
 * 上限引き上げ効果も同様に残りターンを 1 減らし、0 になったものを取り除く。
 */
export const elapseStatusEffectTurn = (
  state: StatusEffectState,
): StatusEffectState => ({
  pools: state.pools.flatMap((pool) => {
    if (pool.remainingTurns === 0) {
      return [pool];
    }
    const remainingTurns = pool.remainingTurns - 1;
    const updated: StatusEffectPool =
      remainingTurns === 0
        ? { ...pool, timedMagnitude: 0, remainingTurns: 0, timedSources: [] }
        : { ...pool, remainingTurns };
    return isEmptyStatusEffectPool(updated) ? [] : [updated];
  }),
  magnitudeCaps: state.magnitudeCaps.flatMap((magnitudeCap) => {
    if (magnitudeCap.remainingTurns === null) {
      return [magnitudeCap];
    }
    const remainingTurns = magnitudeCap.remainingTurns - 1;
    return remainingTurns === 0 ? [] : [{ ...magnitudeCap, remainingTurns }];
  }),
});
