import type { AddOnId, CoverageType } from "./catalog";

/**
 * Mock market data. Every insurer below is fictional; rates and benefits are invented
 * to make the pricing function interesting, not to reflect any real product.
 */

export interface Insurer {
  id: string;
  name: string;
}

export type AddOnOffer =
  /** Part of the plan, no extra charge. */
  | { kind: "included" }
  /** Optional extra for a fixed annual price (AED, before VAT). */
  | { kind: "flat"; price: number }
  /** Optional extra priced as a share of the plan's adjusted premium. */
  | { kind: "percent"; rate: number };

export interface Plan {
  id: string;
  insurerId: string;
  name: string;
  coverage: CoverageType;
  rating: number;
  reviews: number;
  /** Annual premium as a share of the car's value, before risk factors. */
  baseRate: number;
  /** Floor for the base premium (AED). */
  minPremium: number;
  /** Own-damage excess (AED). Third-party plans have none. */
  excess: number;
  /** >1 means this insurer reacts more strongly to risky drivers, <1 more gently. */
  riskSensitivity: number;
  maxVehicleAge: number;
  maxVehicleValue: number;
  minDriverAge: number;
  minLicenceYears: number;
  addOns: Partial<Record<AddOnId, AddOnOffer>>;
  benefits: string[];
}

export const INSURERS: Insurer[] = [
  { id: "falcon-shield", name: "Falcon Shield Insurance" },
  { id: "pearl-coast", name: "Pearl Coast Assurance" },
  { id: "dune-mutual", name: "Dune & Co Mutual" },
  { id: "meridian-gulf", name: "Meridian Gulf Insurance" },
  { id: "saffron-cover", name: "Saffron Cover" },
  { id: "horizon-takaful", name: "Horizon Takaful" },
  { id: "sandbar-direct", name: "Sandbar Direct" },
];

const inc: AddOnOffer = { kind: "included" };
const flat = (price: number): AddOnOffer => ({ kind: "flat", price });
const pct = (rate: number): AddOnOffer => ({ kind: "percent", rate });

export const PLANS: Plan[] = [
  // Comprehensive ---------------------------------------------------------
  {
    id: "falcon-platinum",
    insurerId: "falcon-shield",
    name: "Shield Platinum",
    coverage: "comprehensive",
    rating: 4.8,
    reviews: 2140,
    baseRate: 0.0295,
    minPremium: 2100,
    excess: 250,
    riskSensitivity: 0.9,
    maxVehicleAge: 15,
    maxVehicleValue: 2_000_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc, rental: inc, "agency-repair": inc },
    benefits: [
      "Agency repair for cars up to 5 years old",
      "30-day replacement car after a claim",
      "Off-road cover and GCC cover included",
    ],
  },
  {
    id: "falcon-select",
    insurerId: "falcon-shield",
    name: "Shield Select",
    coverage: "comprehensive",
    rating: 4.6,
    reviews: 3260,
    baseRate: 0.0245,
    minPremium: 1500,
    excess: 500,
    riskSensitivity: 1,
    maxVehicleAge: 15,
    maxVehicleValue: 1_500_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc, rental: flat(260), "agency-repair": pct(0.14) },
    benefits: [
      "Free roadside assistance",
      "GCC cover included",
      "Personal accident cover for driver",
    ],
  },
  {
    id: "pearl-complete",
    insurerId: "pearl-coast",
    name: "Coast Complete",
    coverage: "comprehensive",
    rating: 4.6,
    reviews: 1875,
    baseRate: 0.0265,
    minPremium: 1700,
    excess: 350,
    riskSensitivity: 0.95,
    maxVehicleAge: 12,
    maxVehicleValue: 1_800_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc, rental: inc, "agency-repair": pct(0.12) },
    benefits: [
      "Roadside assistance and rental car included",
      "Windscreen cover with no excess",
      "Cover while driving in Oman",
    ],
  },
  {
    id: "pearl-flex",
    insurerId: "pearl-coast",
    name: "Coast Flex",
    coverage: "comprehensive",
    rating: 4.3,
    reviews: 1420,
    baseRate: 0.0215,
    minPremium: 1350,
    excess: 750,
    riskSensitivity: 1.05,
    maxVehicleAge: 12,
    maxVehicleValue: 1_200_000,
    minDriverAge: 21,
    minLicenceYears: 1,
    addOns: { roadside: flat(150), rental: flat(300), "agency-repair": pct(0.16) },
    benefits: [
      "Pick only the extras you need",
      "Lower premium with a higher excess",
      "Pay monthly at no extra cost",
    ],
  },
  {
    id: "dune-premier",
    insurerId: "dune-mutual",
    name: "Dune Premier",
    coverage: "comprehensive",
    rating: 4.4,
    reviews: 980,
    baseRate: 0.0275,
    minPremium: 1850,
    excess: 300,
    riskSensitivity: 0.85,
    maxVehicleAge: 15,
    maxVehicleValue: 2_000_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc, rental: flat(220), "agency-repair": inc },
    benefits: [
      "Agency repair included",
      "Gentle on young and new drivers",
      "Emergency medical expenses up to AED 5,000",
    ],
  },
  {
    id: "dune-everyday",
    insurerId: "dune-mutual",
    name: "Dune Everyday",
    coverage: "comprehensive",
    rating: 4.1,
    reviews: 2210,
    baseRate: 0.0225,
    minPremium: 1400,
    excess: 600,
    riskSensitivity: 1.1,
    maxVehicleAge: 12,
    maxVehicleValue: 900_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: flat(120), rental: flat(280), "agency-repair": pct(0.18) },
    benefits: [
      "Straightforward cover for daily driving",
      "No-claims discount protected for 2 years",
      "24/7 claims line",
    ],
  },
  {
    id: "meridian-gold",
    insurerId: "meridian-gulf",
    name: "Meridian Gold",
    coverage: "comprehensive",
    rating: 4.4,
    reviews: 1530,
    baseRate: 0.0255,
    minPremium: 1650,
    excess: 400,
    riskSensitivity: 1,
    maxVehicleAge: 12,
    maxVehicleValue: 1_500_000,
    minDriverAge: 21,
    minLicenceYears: 1,
    addOns: { roadside: inc, rental: flat(240), "agency-repair": pct(0.13) },
    benefits: [
      "Free roadside assistance",
      "Cover for personal belongings up to AED 2,000",
      "Claims settled in 5 working days on average",
    ],
  },
  {
    id: "saffron-plus",
    insurerId: "saffron-cover",
    name: "Saffron Plus",
    coverage: "comprehensive",
    rating: 4.1,
    reviews: 640,
    baseRate: 0.0235,
    minPremium: 1450,
    excess: 500,
    riskSensitivity: 1.15,
    maxVehicleAge: 10,
    maxVehicleValue: 800_000,
    minDriverAge: 21,
    minLicenceYears: 2,
    addOns: { roadside: flat(110), rental: flat(270) },
    benefits: [
      "Competitive for experienced drivers",
      "Free second driver",
      "Cover while driving in Oman",
    ],
  },
  {
    id: "horizon-comprehensive",
    insurerId: "horizon-takaful",
    name: "Horizon Takaful Comprehensive",
    coverage: "comprehensive",
    rating: 4.3,
    reviews: 1120,
    baseRate: 0.0238,
    minPremium: 1550,
    excess: 450,
    riskSensitivity: 0.95,
    maxVehicleAge: 12,
    maxVehicleValue: 1_400_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc, rental: flat(250) },
    benefits: [
      "Shariah-compliant cooperative cover",
      "Surplus share returned to policyholders",
      "Free roadside assistance",
    ],
  },
  {
    id: "sandbar-comp",
    insurerId: "sandbar-direct",
    name: "Sandbar Online Comprehensive",
    coverage: "comprehensive",
    rating: 3.7,
    reviews: 3890,
    baseRate: 0.0188,
    minPremium: 1150,
    excess: 1000,
    riskSensitivity: 1.25,
    maxVehicleAge: 8,
    maxVehicleValue: 250_000,
    minDriverAge: 23,
    minLicenceYears: 2,
    addOns: { roadside: flat(95) },
    benefits: [
      "Lowest comprehensive prices, bought online",
      "Digital claims in the app",
      "Higher excess keeps the premium down",
    ],
  },
  // Third-party -----------------------------------------------------------
  {
    id: "falcon-essential",
    insurerId: "falcon-shield",
    name: "Shield Essential",
    coverage: "third-party",
    rating: 4.4,
    reviews: 1260,
    baseRate: 0.0016,
    minPremium: 820,
    excess: 0,
    riskSensitivity: 0.8,
    maxVehicleAge: 25,
    maxVehicleValue: 2_000_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: flat(130) },
    benefits: [
      "Third-party liability up to AED 2 million",
      "Legal expenses cover",
      "Instant digital policy",
    ],
  },
  {
    id: "pearl-basic",
    insurerId: "pearl-coast",
    name: "Coast Basic",
    coverage: "third-party",
    rating: 4.2,
    reviews: 870,
    baseRate: 0.0014,
    minPremium: 760,
    excess: 0,
    riskSensitivity: 0.85,
    maxVehicleAge: 25,
    maxVehicleValue: 2_000_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: flat(120) },
    benefits: [
      "Meets the legal minimum",
      "Cover while driving in Oman",
      "Pay monthly at no extra cost",
    ],
  },
  {
    id: "dune-liability",
    insurerId: "dune-mutual",
    name: "Dune Liability",
    coverage: "third-party",
    rating: 4.0,
    reviews: 1930,
    baseRate: 0.0013,
    minPremium: 720,
    excess: 0,
    riskSensitivity: 0.9,
    maxVehicleAge: 20,
    maxVehicleValue: 1_000_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: inc },
    benefits: [
      "Roadside assistance included",
      "Third-party liability up to AED 2 million",
      "Fast renewals",
    ],
  },
  {
    id: "horizon-tpl",
    insurerId: "horizon-takaful",
    name: "Horizon Takaful Liability",
    coverage: "third-party",
    rating: 4.1,
    reviews: 560,
    baseRate: 0.0015,
    minPremium: 790,
    excess: 0,
    riskSensitivity: 0.85,
    maxVehicleAge: 20,
    maxVehicleValue: 1_500_000,
    minDriverAge: 18,
    minLicenceYears: 0,
    addOns: { roadside: flat(100) },
    benefits: [
      "Shariah-compliant cooperative cover",
      "Third-party liability up to AED 2 million",
      "Surplus share returned to policyholders",
    ],
  },
  {
    id: "sandbar-tpl",
    insurerId: "sandbar-direct",
    name: "Sandbar Online Liability",
    coverage: "third-party",
    rating: 3.6,
    reviews: 4210,
    baseRate: 0.0011,
    minPremium: 640,
    excess: 0,
    riskSensitivity: 1.2,
    maxVehicleAge: 15,
    maxVehicleValue: 400_000,
    minDriverAge: 21,
    minLicenceYears: 1,
    addOns: { roadside: flat(90) },
    benefits: [
      "Cheapest legal-minimum cover, bought online",
      "Policy emailed in minutes",
      "Digital claims in the app",
    ],
  },
];

export const INSURER_BY_ID: Record<string, Insurer> = Object.fromEntries(
  INSURERS.map((insurer) => [insurer.id, insurer]),
);
