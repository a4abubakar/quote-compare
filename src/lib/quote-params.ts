import { ADD_ON_IDS, type AddOnId } from "./catalog";
import { sharedQuoteSchema, type QuoteInput } from "./schema";

/** Anything that looks like a search-params bag: URLSearchParams or Next's `searchParams` object. */
export type ParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

export function readList(source: ParamSource, key: string): string[] {
  return (readParam(source, key) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

const toNumber = (value: string | undefined) =>
  value === undefined || value.trim() === "" ? Number.NaN : Number(value);

/** Quote input -> URL params, so a results page is a shareable link. */
export function serializeQuoteInput(input: QuoteInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("make", input.make);
  params.set("model", input.model);
  params.set("year", String(input.year));
  params.set("value", String(input.value));
  params.set("age", String(input.age));
  params.set("licence", String(input.licenceYears));
  params.set("claims", String(input.claims));
  params.set("cover", input.coverage);
  params.set("start", input.startDate);
  if (input.addOns.length) params.set("addons", input.addOns.join(","));
  return params;
}

/** URL params -> validated quote input, or null when the link is incomplete or tampered with. */
export function parseQuoteInput(source: ParamSource): QuoteInput | null {
  const addOns = readList(source, "addons").filter((id): id is AddOnId =>
    (ADD_ON_IDS as readonly string[]).includes(id),
  );
  const result = sharedQuoteSchema.safeParse({
    make: readParam(source, "make") ?? "",
    model: readParam(source, "model") ?? "",
    year: toNumber(readParam(source, "year")),
    value: toNumber(readParam(source, "value")),
    age: toNumber(readParam(source, "age")),
    licenceYears: toNumber(readParam(source, "licence")),
    claims: toNumber(readParam(source, "claims")),
    coverage: readParam(source, "cover"),
    startDate: readParam(source, "start") ?? "",
    addOns,
  });
  return result.success ? result.data : null;
}

/** Params that belong to the quote input rather than to the filters. */
export const INPUT_KEYS = [
  "make",
  "model",
  "year",
  "value",
  "age",
  "licence",
  "claims",
  "cover",
  "start",
  "addons",
] as const;
