import type { AddOnId, CoverageType } from "./catalog";
import { ADD_ON_IDS } from "./catalog";
import { INSURER_BY_ID, PLANS, type Plan } from "./plans";
import type { QuoteInput } from "./schema";

/** UAE VAT on motor insurance premiums. */
export const VAT_RATE = 0.05;
/** Drivers under this age pay a higher excess on comprehensive plans. */
export const YOUNG_DRIVER_AGE = 25;
export const YOUNG_DRIVER_EXCESS = 500;

/** included: free with the plan. added: you chose it and it is priced in. available: offered but not chosen. unavailable: the plan does not offer it. */
export type AddOnStatus = "included" | "added" | "available" | "unavailable";

export interface QuoteAddOn {
  id: AddOnId;
  status: AddOnStatus;
  /** Extra AED (before VAT) this add-on contributed to the premium. */
  price: number;
}

export interface Quote {
  id: string;
  insurerId: string;
  insurerName: string;
  planName: string;
  coverage: CoverageType;
  /** Annual premium in AED, VAT included, rounded to the dirham. */
  premium: number;
  monthly: number;
  excess: number;
  rating: number;
  reviews: number;
  benefits: string[];
  addOns: QuoteAddOn[];
  /** Add-ons that are part of this quote (included in the plan or added by the customer). */
  coveredAddOns: AddOnId[];
  breakdown: {
    base: number;
    vehicleAgeFactor: number;
    driverRiskFactor: number;
    addOns: number;
    vat: number;
  };
}

// --- Risk factors --------------------------------------------------------------------

export function ageFactor(age: number): number {
  if (age < 25) return 1.45;
  if (age < 30) return 1.15;
  if (age < 60) return 1;
  if (age < 70) return 1.2;
  return 1.4;
}

export function licenceFactor(years: number): number {
  if (years < 1) return 1.35;
  if (years < 3) return 1.2;
  if (years < 6) return 1.08;
  if (years < 10) return 1;
  return 0.95;
}

/** Claims in the last three years. No claims earns a discount. */
export function claimsFactor(claims: number): number {
  if (claims <= 0) return 0.9;
  if (claims === 1) return 1.1;
  if (claims === 2) return 1.3;
  return 1.55;
}

export function vehicleAgeFactor(vehicleAge: number): number {
  if (vehicleAge <= 2) return 1;
  if (vehicleAge <= 5) return 1.03;
  if (vehicleAge <= 9) return 1.1;
  return 1.2;
}

export function driverRiskFactor(input: Pick<QuoteInput, "age" | "licenceYears" | "claims">): number {
  return ageFactor(input.age) * licenceFactor(input.licenceYears) * claimsFactor(input.claims);
}

// --- Eligibility ---------------------------------------------------------------------

export interface PricingOptions {
  /** Defaults to the current year; injectable so tests are deterministic. */
  currentYear?: number;
  plans?: Plan[];
}

export function isEligible(plan: Plan, input: QuoteInput, currentYear: number): boolean {
  return (
    currentYear - input.year <= plan.maxVehicleAge &&
    input.value <= plan.maxVehicleValue &&
    input.age >= plan.minDriverAge &&
    input.licenceYears >= plan.minLicenceYears
  );
}

// --- Pricing -------------------------------------------------------------------------

const round = (n: number) => Math.round(n);
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Premium = max(minimum, vehicle value x insurer rate)
 *           x vehicle age factor
 *           x (driver risk factor ^ insurer sensitivity)
 *           + selected add-ons that the plan offers and does not already include
 * then VAT. The function is pure: same input, same quote.
 */
export function priceQuote(plan: Plan, input: QuoteInput, currentYear: number): Quote {
  const base = Math.max(plan.minPremium, input.value * plan.baseRate);
  const vehicleFactor = vehicleAgeFactor(currentYear - input.year);
  const riskFactor = Math.pow(driverRiskFactor(input), plan.riskSensitivity);
  const adjusted = base * vehicleFactor * riskFactor;

  const selected = new Set<AddOnId>(input.addOns);
  const addOns: QuoteAddOn[] = ADD_ON_IDS.map((id) => {
    const offer = plan.addOns[id];
    if (!offer) return { id, status: "unavailable", price: 0 };
    if (offer.kind === "included") return { id, status: "included", price: 0 };
    if (!selected.has(id)) return { id, status: "available", price: 0 };
    const price = offer.kind === "flat" ? offer.price : adjusted * offer.rate;
    return { id, status: "added", price: round(price) };
  });

  const addOnTotal = addOns.reduce((sum, a) => sum + a.price, 0);
  const net = adjusted + addOnTotal;
  const premium = round(net * (1 + VAT_RATE));
  const young = plan.coverage === "comprehensive" && input.age < YOUNG_DRIVER_AGE;

  return {
    id: plan.id,
    insurerId: plan.insurerId,
    insurerName: INSURER_BY_ID[plan.insurerId]?.name ?? plan.insurerId,
    planName: plan.name,
    coverage: plan.coverage,
    premium,
    monthly: Math.ceil(premium / 12),
    excess: plan.excess + (young ? YOUNG_DRIVER_EXCESS : 0),
    rating: plan.rating,
    reviews: plan.reviews,
    benefits: plan.benefits,
    addOns,
    coveredAddOns: addOns
      .filter((a) => a.status === "included" || a.status === "added")
      .map((a) => a.id),
    breakdown: {
      base: round(base),
      vehicleAgeFactor: vehicleFactor,
      driverRiskFactor: round2(riskFactor),
      addOns: addOnTotal,
      vat: premium - round(net),
    },
  };
}

/** Quotes from every plan this customer is eligible for, in catalogue order (unsorted). */
export function calculateQuotes(input: QuoteInput, options: PricingOptions = {}): Quote[] {
  const currentYear = options.currentYear ?? new Date().getFullYear();
  return (options.plans ?? PLANS)
    .filter((plan) => isEligible(plan, input, currentYear))
    .map((plan) => priceQuote(plan, input, currentYear));
}
