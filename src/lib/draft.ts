import type { QuoteInput } from "./schema";

/**
 * The quote form is saved to sessionStorage as the user types, so a refresh (or a trip to the
 * results page and back) doesn't lose their answers. It lives for the tab only, never on a server.
 *
 * `getDraftSnapshot` is shaped for useSyncExternalStore: it reads storage once, then serves an
 * in-memory copy that `saveDraft` keeps in sync, so the snapshot is always referentially stable.
 */

export interface Draft {
  step: number;
  values: Partial<QuoteInput>;
}

export const DRAFT_STORAGE_KEY = "qc-quote-draft";

let cache: string | null | undefined;

export function getDraftSnapshot(): string | null {
  if (cache === undefined) {
    try {
      cache = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      cache = null;
    }
  }
  return cache;
}

/** Server snapshot: `undefined` means "not hydrated yet", so the UI can show a skeleton. */
export const getServerDraftSnapshot = (): undefined => undefined;

export const subscribeToDraft = () => () => {};

export function saveDraft(draft: Draft) {
  const raw = JSON.stringify(draft);
  cache = raw;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, raw);
  } catch {
    /* private mode or quota: the draft just lives in memory */
  }
}

export function clearDraft() {
  cache = null;
  try {
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

/** Test helper: forget the in-memory copy so the next read goes to storage. */
export function resetDraftCache() {
  cache = undefined;
}

/** Tolerates corrupt or hand-edited storage: anything unexpected yields `null`. */
export function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { step, values } = parsed as { step?: unknown; values?: unknown };
    if (typeof values !== "object" || values === null) return null;
    // JSON turns NaN into null; drop those so the fields come back empty.
    const cleaned = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== null && v !== undefined),
    ) as Partial<QuoteInput>;
    return { step: typeof step === "number" && step >= 0 && step <= 3 ? Math.floor(step) : 0, values: cleaned };
  } catch {
    return null;
  }
}
