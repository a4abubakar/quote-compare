/**
 * Static reference data shared by the form, the schema and the results UI.
 * Everything here is illustrative: insurers are fictional and prices are mock data.
 */

export const COVERAGE_TYPES = ["comprehensive", "third-party"] as const;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export const COVERAGE_LABELS: Record<CoverageType, string> = {
  comprehensive: "Comprehensive",
  "third-party": "Third-party liability",
};

export const COVERAGE_DESCRIPTIONS: Record<CoverageType, string> = {
  comprehensive:
    "Covers damage to your own car as well as other people's property and injuries.",
  "third-party":
    "The legal minimum. Covers damage and injury to others, not to your own car.",
};

export const ADD_ON_IDS = ["roadside", "rental", "agency-repair"] as const;
export type AddOnId = (typeof ADD_ON_IDS)[number];

export const ADD_ON_META: Record<AddOnId, { label: string; description: string }> = {
  roadside: {
    label: "Roadside assistance",
    description: "Towing, battery jump-start and flat tyre help, 24/7.",
  },
  rental: {
    label: "Rental car",
    description: "A replacement car while yours is being repaired.",
  },
  "agency-repair": {
    label: "Agency repair",
    description: "Repairs at the brand's authorised service centre.",
  },
};

export const MIN_VEHICLE_VALUE = 10_000;
export const MAX_VEHICLE_VALUE = 2_000_000;
export const MIN_DRIVER_AGE = 18;
export const MAX_DRIVER_AGE = 85;
export const OLDEST_VEHICLE_YEAR = 2005;
export const MAX_START_DAYS_AHEAD = 60;

export const CLAIMS_OPTIONS = [
  { value: 0, label: "No claims" },
  { value: 1, label: "1 claim" },
  { value: 2, label: "2 claims" },
  { value: 3, label: "3 or more claims" },
] as const;

/** Makes and models offered in the form. Kept short on purpose. */
export const VEHICLE_CATALOG: Record<string, readonly string[]> = {
  Toyota: ["Camry", "Corolla", "Land Cruiser", "Yaris", "RAV4"],
  Nissan: ["Altima", "Patrol", "Sunny", "X-Trail"],
  Honda: ["Accord", "Civic", "CR-V"],
  Hyundai: ["Elantra", "Sonata", "Tucson", "Santa Fe"],
  Kia: ["Cerato", "Sportage", "Sorento"],
  Ford: ["Explorer", "Mustang", "Territory"],
  Mazda: ["Mazda3", "CX-5", "CX-9"],
  Chevrolet: ["Tahoe", "Malibu", "Captiva"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLE"],
  BMW: ["3 Series", "5 Series", "X5"],
};

export const VEHICLE_MAKES = Object.keys(VEHICLE_CATALOG);
