import { calculateQuotes, type Quote } from "./pricing";
import type { QuoteInput } from "./schema";

/** Artificial latency so loading states are visible. Override with QUOTE_DELAY_MS (0 disables it). */
export function quoteDelayMs(): number {
  const raw = process.env.QUOTE_DELAY_MS;
  if (raw === undefined || raw.trim() === "") return 900;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 900;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Stand-in for a call to a pricing API. It only exists on the server and always waits a little,
 * which is what gives `loading.tsx` and the Suspense skeleton something to show.
 */
export async function fetchQuotes(input: QuoteInput): Promise<Quote[]> {
  await sleep(quoteDelayMs());
  return calculateQuotes(input);
}
