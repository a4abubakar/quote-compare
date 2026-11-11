import { ADD_ON_IDS, COVERAGE_TYPES, type AddOnId, type CoverageType } from "./catalog";
import type { Quote } from "./pricing";
import { readList, readParam, type ParamSource } from "./quote-params";

export const SORT_KEYS = ["price-asc", "price-desc", "rating", "excess"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  rating: "Rating: best first",
  excess: "Excess: lowest first",
};

export const MAX_COMPARE = 3;

export type CoverageFilter = CoverageType | "all";

export interface Filters {
  coverage: CoverageFilter;
  /** null = no cap. */
  maxPremium: number | null;
  /** Empty = every insurer. */
  insurers: string[];
  /** Add-ons that must be part of the quote (included in the plan or added by the customer). */
  mustHave: AddOnId[];
  sort: SortKey;
  compare: string[];
}

export interface FilterDefaults {
  /** Shown when the URL has no `type`: the cover the customer asked for in the form. */
  coverage: CoverageFilter;
}

export const FILTER_KEYS = ["type", "max", "insurer", "must", "sort", "compare"] as const;

const isCoverage = (v: string | undefined): v is CoverageFilter =>
  v === "all" || (COVERAGE_TYPES as readonly string[]).includes(v ?? "");
const isSort = (v: string | undefined): v is SortKey => (SORT_KEYS as readonly string[]).includes(v ?? "");

/** Reads the filter state from URL params. Unknown or malformed values fall back to defaults. */
export function parseFilters(source: ParamSource, defaults: FilterDefaults): Filters {
  const type = readParam(source, "type");
  const max = Number(readParam(source, "max"));
  const sort = readParam(source, "sort");
  return {
    coverage: isCoverage(type) ? type : defaults.coverage,
    maxPremium: Number.isFinite(max) && max > 0 ? Math.round(max) : null,
    insurers: readList(source, "insurer"),
    mustHave: readList(source, "must").filter((id): id is AddOnId =>
      (ADD_ON_IDS as readonly string[]).includes(id),
    ),
    sort: isSort(sort) ? sort : "price-asc",
    compare: [...new Set(readList(source, "compare"))].slice(0, MAX_COMPARE),
  };
}

/**
 * Writes filters back onto a copy of `base`, keeping unrelated params (the quote input)
 * and leaving out anything that equals its default so URLs stay short.
 */
export function applyFiltersToParams(
  base: URLSearchParams,
  filters: Filters,
  defaults: FilterDefaults,
): URLSearchParams {
  const params = new URLSearchParams(base);
  for (const key of FILTER_KEYS) params.delete(key);
  if (filters.coverage !== defaults.coverage) params.set("type", filters.coverage);
  if (filters.maxPremium !== null) params.set("max", String(filters.maxPremium));
  if (filters.insurers.length) params.set("insurer", filters.insurers.join(","));
  if (filters.mustHave.length) params.set("must", filters.mustHave.join(","));
  if (filters.sort !== "price-asc") params.set("sort", filters.sort);
  if (filters.compare.length) params.set("compare", filters.compare.join(","));
  return params;
}

export function applyFilters(quotes: Quote[], filters: Filters): Quote[] {
  return quotes.filter(
    (q) =>
      (filters.coverage === "all" || q.coverage === filters.coverage) &&
      (filters.maxPremium === null || q.premium <= filters.maxPremium) &&
      (filters.insurers.length === 0 || filters.insurers.includes(q.insurerId)) &&
      filters.mustHave.every((id) => q.coveredAddOns.includes(id)),
  );
}

/** Stable, total ordering: every sort falls back to price, then rating, then id. */
export function sortQuotes(quotes: Quote[], sort: SortKey): Quote[] {
  const byPrice = (a: Quote, b: Quote) => a.premium - b.premium;
  const byRating = (a: Quote, b: Quote) => b.rating - a.rating;
  const tieBreak = (a: Quote, b: Quote) =>
    byPrice(a, b) || byRating(a, b) || a.id.localeCompare(b.id);
  const primary: Record<SortKey, (a: Quote, b: Quote) => number> = {
    "price-asc": byPrice,
    "price-desc": (a, b) => b.premium - a.premium,
    rating: byRating,
    excess: (a, b) => a.excess - b.excess,
  };
  return [...quotes].sort((a, b) => primary[sort](a, b) || tieBreak(a, b));
}

export function filterAndSort(quotes: Quote[], filters: Filters): Quote[] {
  return sortQuotes(applyFilters(quotes, filters), filters.sort);
}

/** Bounds for the premium slider, rounded to tidy steps. */
export function premiumBounds(quotes: Quote[], step = 100): { min: number; max: number } {
  if (quotes.length === 0) return { min: 0, max: step };
  const premiums = quotes.map((q) => q.premium);
  return {
    min: Math.floor(Math.min(...premiums) / step) * step,
    max: Math.ceil(Math.max(...premiums) / step) * step,
  };
}

export function hasActiveFilters(filters: Filters, defaults: FilterDefaults): boolean {
  return (
    filters.coverage !== defaults.coverage ||
    filters.maxPremium !== null ||
    filters.insurers.length > 0 ||
    filters.mustHave.length > 0
  );
}

export function resetFilters(filters: Filters, defaults: FilterDefaults): Filters {
  return {
    ...filters,
    coverage: defaults.coverage,
    maxPremium: null,
    insurers: [],
    mustHave: [],
  };
}
