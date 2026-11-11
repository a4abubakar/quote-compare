import type { QuoteInput } from "./schema";

/** A typical, low-risk customer used across unit tests. */
export const baseInput: QuoteInput = {
  make: "Toyota",
  model: "Camry",
  year: 2022,
  value: 85_000,
  age: 34,
  licenceYears: 12,
  claims: 0,
  coverage: "comprehensive",
  startDate: "2026-12-01",
  addOns: [],
};
