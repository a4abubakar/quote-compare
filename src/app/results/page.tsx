import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResultsSkeleton } from "@/components/results/results-skeleton";
import { ResultsView } from "@/components/results/results-view";
import { parseQuoteInput } from "@/lib/quote-params";
import { fetchQuotes } from "@/lib/quotes-service";

export const metadata: Metadata = {
  title: "Your car insurance quotes",
  description: "Compare, filter and sort your car insurance quotes.",
  robots: { index: false },
};

export default function ResultsPage({ searchParams }: PageProps<"/results">) {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <Results searchParams={searchParams} />
    </Suspense>
  );
}

async function Results({ searchParams }: { searchParams: PageProps<"/results">["searchParams"] }) {
  // Quote validation and pricing read the clock (the current year), so opt into request-time rendering.
  await connection();
  const params = await searchParams;
  const input = parseQuoteInput(params);

  if (!input) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">We need a few details first</h1>
        <p className="mt-2 text-muted">
          This link is missing some of the answers we use to price your quotes.
        </p>
        <Link
          href="/quote"
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-fg hover:bg-primary-hover"
        >
          Start a quote
        </Link>
      </div>
    );
  }

  // `?fail=1` makes the pricing service throw, to demo (and test) error.tsx and its retry button.
  if (params.fail === "1") throw new Error("Simulated pricing service failure");

  const quotes = await fetchQuotes(input);
  return <ResultsView input={input} quotes={quotes} />;
}
