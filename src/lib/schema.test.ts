import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { baseInput } from "./fixtures";
import {
  addDays,
  coverageSchema,
  driverSchema,
  quoteSchema,
  sharedQuoteSchema,
  toIsoDate,
  vehicleSchema,
} from "./schema";

type Parsed = { error?: { issues: { path: PropertyKey[]; message: string }[] } };
const messages = (result: Parsed): Record<string, string> =>
  Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));

describe("quote schemas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 11, 10, 0, 0)); // 11 Nov 2026
  });
  afterEach(() => vi.useRealTimers());

  const valid = { ...baseInput, startDate: "2026-11-20" };

  it("accepts a complete, valid quote", () => {
    expect(quoteSchema.safeParse(valid).success).toBe(true);
  });

  it("vehicle step: names the empty fields and rejects a model that does not belong to the make", () => {
    const empty = vehicleSchema.safeParse({ make: "", model: "", year: Number.NaN, value: Number.NaN });
    expect(messages(empty)).toMatchObject({
      make: "Select the make of your car",
      model: "Select the model",
      year: "Select the year of manufacture",
      value: "Enter the estimated value of your car in AED",
    });
    const mismatch = vehicleSchema.safeParse({ ...valid, make: "Toyota", model: "Mustang" });
    expect(messages(mismatch).model).toBe("Select a Toyota model from the list");
  });

  it("vehicle step: bounds the value", () => {
    expect(messages(vehicleSchema.safeParse({ ...valid, value: 500 })).value).toMatch(/at least AED 10,000/);
    expect(messages(vehicleSchema.safeParse({ ...valid, value: 5_000_000 })).value).toMatch(
      /more than AED 2,000,000/,
    );
  });

  it("driver step: enforces age and a licence that fits the driver's age", () => {
    expect(messages(driverSchema.safeParse({ age: 17, licenceYears: 0, claims: 0 })).age).toMatch(/at least 18/);
    const impossible = driverSchema.safeParse({ age: 20, licenceYears: 10, claims: 0 });
    expect(messages(impossible).licenceYears).toMatch(/held a licence for 10 years at age 20/);
    expect(driverSchema.safeParse({ age: 20, licenceYears: 2, claims: 0 }).success).toBe(true);
    expect(messages(driverSchema.safeParse({ age: Number.NaN, licenceYears: 1, claims: 9 })).age).toBe(
      "Enter your age",
    );
  });

  it("coverage step: start date must be today or later, within 60 days", () => {
    const check = (startDate: string) => coverageSchema.safeParse({ ...valid, startDate });
    expect(check("2026-11-11").success).toBe(true); // today
    expect(messages(check("2026-11-10")).startDate).toBe("The start date can't be in the past");
    expect(messages(check(toIsoDate(addDays(new Date(), 61)))).startDate).toMatch(/within the next 60 days/);
    expect(messages(check("2026-02-31")).startDate).toBe("Choose a valid start date");
    expect(messages(coverageSchema.safeParse({ ...valid, coverage: "none" })).coverage).toBe(
      "Choose a type of cover",
    );
  });

  it("shared (URL) schema ignores the start-date window", () => {
    const stale = { ...valid, startDate: "2025-01-01" };
    expect(quoteSchema.safeParse(stale).success).toBe(false);
    expect(sharedQuoteSchema.safeParse(stale).success).toBe(true);
  });
});
