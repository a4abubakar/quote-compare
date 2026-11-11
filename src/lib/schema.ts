import { z } from "zod";
import {
  ADD_ON_IDS,
  COVERAGE_TYPES,
  MAX_DRIVER_AGE,
  MAX_START_DAYS_AHEAD,
  MAX_VEHICLE_VALUE,
  MIN_DRIVER_AGE,
  MIN_VEHICLE_VALUE,
  OLDEST_VEHICLE_YEAR,
  VEHICLE_CATALOG,
} from "./catalog";

/**
 * One schema, three consumers: the wizard validates each step with the step schemas,
 * the final submit validates `quoteSchema`, and the results page parses the URL with
 * `sharedQuoteSchema` (same rules, minus "start date must not be in the past", because
 * a shared link is allowed to outlive its start date).
 *
 * Fields use `z.number()` (the form registers them with `valueAsNumber`), so an empty or
 * non-numeric input arrives as NaN and gets the friendly message below.
 */

const num = (message: string) => z.number({ error: message });

export const vehicleShape = {
  make: z.string().min(1, "Select the make of your car"),
  model: z.string().min(1, "Select the model"),
  year: num("Select the year of manufacture")
    .int("Select the year of manufacture")
    .min(OLDEST_VEHICLE_YEAR, `Cars older than ${OLDEST_VEHICLE_YEAR} can't be quoted online`),
  value: num("Enter the estimated value of your car in AED")
    .int("Enter a whole number of dirhams")
    .min(MIN_VEHICLE_VALUE, `The value must be at least AED ${MIN_VEHICLE_VALUE.toLocaleString("en-US")}`)
    .max(MAX_VEHICLE_VALUE, `The value can't be more than AED ${MAX_VEHICLE_VALUE.toLocaleString("en-US")}`),
};

export const driverShape = {
  age: num("Enter your age")
    .int("Enter your age as a whole number")
    .min(MIN_DRIVER_AGE, `You must be at least ${MIN_DRIVER_AGE} to be insured`)
    .max(MAX_DRIVER_AGE, `Online quotes are available up to age ${MAX_DRIVER_AGE}`),
  licenceYears: num("Enter how many years you have held your licence")
    .int("Enter a whole number of years")
    .min(0, "Years can't be negative")
    .max(MAX_DRIVER_AGE, "That looks too high"),
  claims: num("Select your claims history")
    .int()
    .min(0, "Select your claims history")
    .max(3, "Select your claims history"),
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a start date");

export const coverageShape = {
  coverage: z.enum(COVERAGE_TYPES, { error: "Choose a type of cover" }),
  startDate: isoDate,
  addOns: z.array(z.enum(ADD_ON_IDS)),
};

type Issue = { path: string[]; message: string };
type Checker<T> = (value: T) => Issue[];

export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function addDays(date: Date, days: number) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Cross-field rules. Each returns issues instead of throwing so they are easy to unit test. */
export const vehicleChecks: Checker<{ make: string; model: string; year: number }> = ({
  make,
  model,
  year,
}) => {
  const issues: Issue[] = [];
  const models = VEHICLE_CATALOG[make];
  if (!models) issues.push({ path: ["make"], message: "Select a make from the list" });
  else if (!models.includes(model))
    issues.push({ path: ["model"], message: `Select a ${make} model from the list` });
  const maxYear = new Date().getFullYear() + 1;
  if (year > maxYear) issues.push({ path: ["year"], message: "That year is in the future" });
  return issues;
};

export const driverChecks: Checker<{ age: number; licenceYears: number }> = ({
  age,
  licenceYears,
}) =>
  licenceYears > age - MIN_DRIVER_AGE
    ? [
        {
          path: ["licenceYears"],
          message: `You can't have held a licence for ${licenceYears} years at age ${age}`,
        },
      ]
    : [];

export const startDateChecks =
  (now: () => Date = () => new Date()): Checker<{ startDate: string }> =>
  ({ startDate }) => {
    const parsed = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime()) || toIsoDate(parsed) !== startDate)
      return [{ path: ["startDate"], message: "Choose a valid start date" }];
    const today = toIsoDate(now());
    if (startDate < today) return [{ path: ["startDate"], message: "The start date can't be in the past" }];
    if (startDate > toIsoDate(addDays(now(), MAX_START_DAYS_AHEAD)))
      return [
        {
          path: ["startDate"],
          message: `Choose a start date within the next ${MAX_START_DAYS_AHEAD} days`,
        },
      ];
    return [];
  };

function refineWith<S extends z.ZodObject>(schema: S, ...checkers: Checker<z.infer<S>>[]) {
  return schema.superRefine((value, ctx) => {
    for (const check of checkers)
      for (const issue of check(value)) ctx.addIssue({ code: "custom", ...issue });
  });
}

const vehicleObject = z.object(vehicleShape);
const driverObject = z.object(driverShape);
const coverageObject = z.object(coverageShape);
const quoteObject = z.object({ ...vehicleShape, ...driverShape, ...coverageShape });

export const vehicleSchema = refineWith(vehicleObject, vehicleChecks);
export const driverSchema = refineWith(driverObject, driverChecks);
export const coverageSchema = refineWith(coverageObject, startDateChecks());
/** Review step: no new fields, the whole form has to be valid. */
export const quoteSchema = refineWith(quoteObject, vehicleChecks, driverChecks, startDateChecks());
/** For URLs: same rules minus the start-date window. */
export const sharedQuoteSchema = refineWith(quoteObject, vehicleChecks, driverChecks);

export type QuoteInput = z.infer<typeof quoteObject>;

export const STEP_IDS = ["vehicle", "driver", "coverage", "review"] as const;
export type StepId = (typeof STEP_IDS)[number];

/** Fields owned by each step, used to find the step that holds a given error. */
export const STEP_FIELDS: Record<StepId, readonly (keyof QuoteInput)[]> = {
  vehicle: Object.keys(vehicleShape) as (keyof QuoteInput)[],
  driver: Object.keys(driverShape) as (keyof QuoteInput)[],
  coverage: Object.keys(coverageShape) as (keyof QuoteInput)[],
  review: [],
};

export const STEP_SCHEMAS = {
  vehicle: vehicleSchema,
  driver: driverSchema,
  coverage: coverageSchema,
  review: quoteSchema,
} as const;
