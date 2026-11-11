import { describe, expect, it } from "vitest";
import {
  applyFilters,
  applyFiltersToParams,
  filterAndSort,
  hasActiveFilters,
  MAX_COMPARE,
  parseFilters,
  premiumBounds,
  resetFilters,
  sortQuotes,
  type Filters,
} from "./filters";
import { baseInput } from "./fixtures";
import { calculateQuotes } from "./pricing";
import { parseQuoteInput, serializeQuoteInput } from "./quote-params";

const quotes = calculateQuotes({ ...baseInput, addOns: ["rental"] }, { currentYear: 2026 });
const defaults = { coverage: "comprehensive" as const };
const none: Filters = {
  coverage: "all",
  maxPremium: null,
  insurers: [],
  mustHave: [],
  sort: "price-asc",
  compare: [],
};

describe("applyFilters", () => {
  it("filters by coverage type", () => {
    const result = applyFilters(quotes, { ...none, coverage: "third-party" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((q) => q.coverage === "third-party")).toBe(true);
  });

  it("filters by max premium (inclusive) and by insurer", () => {
    const cap = sortQuotes(quotes, "price-asc")[4].premium;
    const capped = applyFilters(quotes, { ...none, maxPremium: cap });
    expect(capped.length).toBeGreaterThanOrEqual(5);
    expect(capped.every((q) => q.premium <= cap)).toBe(true);

    const falcon = applyFilters(quotes, { ...none, insurers: ["falcon-shield"] });
    expect(falcon.length).toBeGreaterThan(1);
    expect(falcon.every((q) => q.insurerId === "falcon-shield")).toBe(true);
  });

  it("requires every must-have add-on to be part of the quote", () => {
    const result = applyFilters(quotes, { ...none, mustHave: ["roadside", "rental"] });
    expect(result.length).toBeGreaterThan(0);
    for (const q of result) expect(q.coveredAddOns).toEqual(expect.arrayContaining(["roadside", "rental"]));
    // a plan that doesn't offer rental at all can never match
    expect(result.some((q) => q.id === "sandbar-comp")).toBe(false);
  });

  it("returns nothing when filters contradict each other", () => {
    expect(applyFilters(quotes, { ...none, maxPremium: 100 })).toEqual([]);
  });
});

describe("sortQuotes", () => {
  it("sorts by price both ways without mutating the input", () => {
    const before = quotes.map((q) => q.id);
    const asc = sortQuotes(quotes, "price-asc").map((q) => q.premium);
    const desc = sortQuotes(quotes, "price-desc").map((q) => q.premium);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...asc].reverse());
    expect(quotes.map((q) => q.id)).toEqual(before);
  });

  it("sorts by rating (best first) and excess (lowest first) with price as tie-break", () => {
    const byRating = sortQuotes(quotes, "rating");
    for (let i = 1; i < byRating.length; i++) {
      expect(byRating[i - 1].rating).toBeGreaterThanOrEqual(byRating[i].rating);
      if (byRating[i - 1].rating === byRating[i].rating)
        expect(byRating[i - 1].premium).toBeLessThanOrEqual(byRating[i].premium);
    }
    const byExcess = sortQuotes(quotes, "excess");
    for (let i = 1; i < byExcess.length; i++)
      expect(byExcess[i - 1].excess).toBeLessThanOrEqual(byExcess[i].excess);
  });

  it("filterAndSort composes both steps", () => {
    const result = filterAndSort(quotes, { ...none, coverage: "comprehensive", sort: "excess" });
    expect(result.every((q) => q.coverage === "comprehensive")).toBe(true);
    expect(result[0].excess).toBeLessThanOrEqual(result[result.length - 1].excess);
  });
});

describe("URL state", () => {
  it("round-trips filters through search params and omits defaults", () => {
    const filters: Filters = {
      coverage: "all",
      maxPremium: 2500,
      insurers: ["pearl-coast", "dune-mutual"],
      mustHave: ["roadside"],
      sort: "rating",
      compare: ["falcon-select", "pearl-complete"],
    };
    const base = serializeQuoteInput(baseInput);
    const params = applyFiltersToParams(base, filters, defaults);
    expect(params.get("make")).toBe("Toyota"); // quote input survives
    expect(parseFilters(params, defaults)).toEqual(filters);

    const plain = applyFiltersToParams(base, { ...none, coverage: "comprehensive" }, defaults);
    expect([...plain.keys()].filter((k) => ["type", "max", "sort"].includes(k))).toEqual([]);
  });

  it("falls back to defaults for junk and caps the compare list", () => {
    const params = new URLSearchParams(
      "type=boat&max=abc&sort=cheapest&must=roadside,wings&compare=a,b,c,d,a",
    );
    const parsed = parseFilters(params, defaults);
    expect(parsed).toMatchObject({
      coverage: "comprehensive",
      maxPremium: null,
      sort: "price-asc",
      mustHave: ["roadside"],
    });
    expect(parsed.compare).toEqual(["a", "b", "c"].slice(0, MAX_COMPARE));
  });

  it("reports and clears active filters", () => {
    const active: Filters = { ...none, coverage: "third-party", maxPremium: 900, sort: "rating", compare: ["x"] };
    expect(hasActiveFilters(active, defaults)).toBe(true);
    const reset = resetFilters(active, defaults);
    expect(hasActiveFilters(reset, defaults)).toBe(false);
    expect(reset.sort).toBe("rating"); // sort and compare are not filters
    expect(reset.compare).toEqual(["x"]);
  });

  it("computes slider bounds from the quotes", () => {
    const { min, max } = premiumBounds(quotes);
    expect(min % 100).toBe(0);
    expect(max % 100).toBe(0);
    expect(min).toBeLessThanOrEqual(Math.min(...quotes.map((q) => q.premium)));
    expect(max).toBeGreaterThanOrEqual(Math.max(...quotes.map((q) => q.premium)));
  });
});

describe("quote input in the URL", () => {
  it("round-trips a valid quote input", () => {
    const input = { ...baseInput, addOns: ["roadside" as const, "rental" as const] };
    expect(parseQuoteInput(serializeQuoteInput(input))).toEqual(input);
  });

  it("rejects incomplete or tampered links", () => {
    expect(parseQuoteInput(new URLSearchParams())).toBeNull();
    const tampered = serializeQuoteInput(baseInput);
    tampered.set("value", "-5");
    expect(parseQuoteInput(tampered)).toBeNull();
    tampered.set("value", "85000");
    tampered.set("model", "Mustang"); // not a Toyota
    expect(parseQuoteInput(tampered)).toBeNull();
  });

  it("accepts the object form used by Next searchParams", () => {
    const record = Object.fromEntries(serializeQuoteInput(baseInput));
    expect(parseQuoteInput(record)).toEqual(baseInput);
  });
});
