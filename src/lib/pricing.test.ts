import { describe, expect, it } from "vitest";
import { baseInput } from "./fixtures";
import {
  ageFactor,
  calculateQuotes,
  claimsFactor,
  driverRiskFactor,
  isEligible,
  licenceFactor,
  priceQuote,
  VAT_RATE,
  vehicleAgeFactor,
} from "./pricing";
import { PLANS } from "./plans";

const YEAR = 2026;
const plan = (id: string) => {
  const found = PLANS.find((p) => p.id === id);
  if (!found) throw new Error(`unknown plan ${id}`);
  return found;
};

describe("risk factors", () => {
  it("charges young and very old drivers more than mid-career drivers", () => {
    expect(ageFactor(21)).toBeGreaterThan(ageFactor(40));
    expect(ageFactor(72)).toBeGreaterThan(ageFactor(40));
  });

  it("rewards experience and a clean record", () => {
    expect(licenceFactor(0)).toBeGreaterThan(licenceFactor(12));
    expect(claimsFactor(0)).toBeLessThan(1);
    expect(claimsFactor(2)).toBeGreaterThan(claimsFactor(1));
    expect(claimsFactor(3)).toBeGreaterThan(claimsFactor(2));
  });

  it("combines the three driver factors multiplicatively", () => {
    expect(driverRiskFactor({ age: 22, licenceYears: 0, claims: 1 })).toBeCloseTo(1.45 * 1.35 * 1.1);
  });

  it("surcharges older vehicles", () => {
    expect(vehicleAgeFactor(1)).toBe(1);
    expect(vehicleAgeFactor(12)).toBeGreaterThan(vehicleAgeFactor(4));
  });
});

describe("priceQuote", () => {
  it("prices base rate x value x factors, plus VAT", () => {
    const p = plan("falcon-select"); // 2.45% of value, sensitivity 1
    const quote = priceQuote(p, baseInput, YEAR);
    // 85,000 x 2.45% = 2,082.5; vehicle age 4 -> 1.03; risk 1 x 0.95 x 0.9 = 0.855
    const expected = Math.round(2082.5 * 1.03 * 0.855 * (1 + VAT_RATE));
    expect(quote.premium).toBe(expected);
    expect(quote.monthly).toBe(Math.ceil(expected / 12));
  });

  it("never prices below the plan minimum", () => {
    const cheapCar = { ...baseInput, value: 10_000 };
    const quote = priceQuote(plan("falcon-select"), cheapCar, YEAR);
    expect(quote.breakdown.base).toBe(plan("falcon-select").minPremium);
  });

  it("is monotonic in vehicle value and driver risk", () => {
    const p = plan("pearl-complete");
    const cheap = priceQuote(p, { ...baseInput, value: 60_000 }, YEAR).premium;
    const dear = priceQuote(p, { ...baseInput, value: 140_000 }, YEAR).premium;
    expect(dear).toBeGreaterThan(cheap);
    const risky = priceQuote(p, { ...baseInput, age: 20, licenceYears: 1, claims: 2 }, YEAR).premium;
    expect(risky).toBeGreaterThan(priceQuote(p, baseInput, YEAR).premium);
  });

  it("lets stricter insurers punish risk harder", () => {
    const risky = { ...baseInput, age: 22, licenceYears: 3, claims: 2, value: 70_000 };
    const gentle = priceQuote(plan("dune-premier"), risky, YEAR).breakdown.driverRiskFactor;
    const strict = priceQuote(plan("dune-everyday"), risky, YEAR).breakdown.driverRiskFactor;
    expect(strict).toBeGreaterThan(gentle);
  });

  it("adds optional add-ons, skips included ones and flags unavailable ones", () => {
    const p = plan("falcon-select"); // roadside included, rental flat 260, agency 14%
    const quote = priceQuote(p, { ...baseInput, addOns: ["roadside", "rental", "agency-repair"] }, YEAR);
    const byId = Object.fromEntries(quote.addOns.map((a) => [a.id, a]));
    expect(byId.roadside).toMatchObject({ status: "included", price: 0 });
    expect(byId.rental).toMatchObject({ status: "added", price: 260 });
    expect(byId["agency-repair"].status).toBe("added");
    expect(byId["agency-repair"].price).toBeGreaterThan(0);
    expect(quote.coveredAddOns).toEqual(["roadside", "rental", "agency-repair"]);

    const sandbar = priceQuote(plan("sandbar-comp"), { ...baseInput, value: 90_000, addOns: ["rental"] }, YEAR);
    expect(sandbar.addOns.find((a) => a.id === "rental")?.status).toBe("unavailable");
    expect(sandbar.coveredAddOns).not.toContain("rental");
  });

  it("charges a higher excess to young drivers on comprehensive cover only", () => {
    const young = { ...baseInput, age: 23, licenceYears: 4 };
    expect(priceQuote(plan("dune-premier"), young, YEAR).excess).toBe(plan("dune-premier").excess + 500);
    expect(priceQuote(plan("dune-premier"), baseInput, YEAR).excess).toBe(plan("dune-premier").excess);
    expect(priceQuote(plan("dune-liability"), young, YEAR).excess).toBe(0);
  });

  it("is pure: the same input always produces the same quote", () => {
    expect(priceQuote(plan("meridian-gold"), baseInput, YEAR)).toEqual(
      priceQuote(plan("meridian-gold"), baseInput, YEAR),
    );
  });
});

describe("calculateQuotes", () => {
  it("returns a full market for a typical customer", () => {
    const quotes = calculateQuotes(baseInput, { currentYear: YEAR });
    expect(quotes).toHaveLength(PLANS.length);
    expect(new Set(quotes.map((q) => q.id)).size).toBe(PLANS.length);
    expect(quotes.every((q) => q.premium > 0)).toBe(true);
  });

  it("drops plans the customer is not eligible for", () => {
    const old = { ...baseInput, year: 2012, value: 30_000 }; // 14 years old
    const ids = calculateQuotes(old, { currentYear: YEAR }).map((q) => q.id);
    expect(ids).toContain("falcon-platinum"); // up to 15 years
    expect(ids).not.toContain("meridian-gold"); // up to 12 years
    expect(ids).not.toContain("sandbar-comp");

    const novice = { ...baseInput, age: 19, licenceYears: 0 };
    expect(isEligible(plan("saffron-plus"), novice, YEAR)).toBe(false);
    expect(isEligible(plan("falcon-select"), novice, YEAR)).toBe(true);
  });

  it("drops plans when the car is worth more than the plan allows", () => {
    const ids = calculateQuotes({ ...baseInput, value: 1_600_000 }, { currentYear: YEAR }).map((q) => q.id);
    expect(ids).toContain("falcon-platinum");
    expect(ids).not.toContain("falcon-select");
  });
});
