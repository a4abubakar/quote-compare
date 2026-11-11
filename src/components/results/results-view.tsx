"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { COVERAGE_LABELS } from "@/lib/catalog";
import {
  filterAndSort,
  hasActiveFilters,
  MAX_COMPARE,
  premiumBounds,
  resetFilters,
  SORT_KEYS,
  SORT_LABELS,
  type SortKey,
} from "@/lib/filters";
import { formatAED, formatDate } from "@/lib/format";
import type { Quote } from "@/lib/pricing";
import type { QuoteInput } from "@/lib/schema";
import { inputClass } from "@/components/ui/field";
import { CompareDialog, CompareTray } from "./compare";
import { FiltersPanel } from "./filters-panel";
import { PlanCard } from "./plan-card";
import { useFilters } from "./use-filters";

export function ResultsView({ input, quotes }: { input: QuoteInput; quotes: Quote[] }) {
  const defaults = useMemo(() => ({ coverage: input.coverage }), [input.coverage]);
  const { filters, update } = useFilters(defaults);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const bounds = useMemo(() => premiumBounds(quotes), [quotes]);
  const visible = useMemo(() => filterAndSort(quotes, filters), [quotes, filters]);
  const active = hasActiveFilters(filters, defaults);

  // Ids in the URL may be stale (e.g. a shared link for a different car), so resolve them against what we have.
  const comparePlans = useMemo(
    () => filters.compare.flatMap((id) => quotes.find((q) => q.id === id) ?? []),
    [filters.compare, quotes],
  );
  const compareIds = useMemo(() => new Set(comparePlans.map((p) => p.id)), [comparePlans]);
  const full = comparePlans.length >= MAX_COMPARE;

  const toggleCompare = useCallback(
    (id: string) => {
      const ids = comparePlans.map((p) => p.id);
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : ids.length < MAX_COMPARE ? [...ids, id] : ids;
      update({ compare: next }, "replace");
    },
    [comparePlans, update],
  );

  const cheapest = visible.length ? Math.min(...visible.map((q) => q.premium)) : null;

  return (
    <div className={comparePlans.length > 0 ? "pb-28" : undefined}>
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Your car insurance quotes</h1>
        <p className="mt-2 text-muted">
          {input.year} {input.make} {input.model} worth {formatAED(input.value)}, driver aged {input.age}, starting{" "}
          {formatDate(input.startDate)}.{" "}
          <Link href="/quote" className="font-semibold text-primary underline underline-offset-4 hover:text-primary-hover">
            Edit details
          </Link>
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <aside aria-label="Filters" className="lg:sticky lg:top-20">
          <button
            type="button"
            className="mb-3 inline-flex h-11 w-full items-center justify-between rounded-lg border border-control bg-surface px-4 font-semibold lg:hidden"
            aria-expanded={filtersOpen}
            aria-controls="filters-region"
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <span>Filters{active ? " (active)" : ""}</span>
            <span aria-hidden="true">{filtersOpen ? "Hide" : "Show"}</span>
          </button>
          <div id="filters-region" className={filtersOpen ? "block" : "hidden lg:block"}>
            <FiltersPanel
              filters={filters}
              bounds={bounds}
              hasActive={active}
              onChange={update}
              onReset={() => update(resetFilters(filters, defaults))}
            />
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="results-heading" className="text-xl font-bold tracking-tight">
                <span data-testid="result-count">{visible.length}</span> {visible.length === 1 ? "plan" : "plans"}
              </h2>
              <p role="status" aria-live="polite" className="text-sm text-muted">
                {visible.length === quotes.length
                  ? `Showing every plan you are eligible for.`
                  : `Showing ${visible.length} of ${quotes.length} plans.`}
                {filters.coverage !== "all" ? ` Cover: ${COVERAGE_LABELS[filters.coverage]}.` : ""}
              </p>
            </div>
            <div className="w-full sm:w-56">
              <label htmlFor="sort" className="mb-1 block text-sm font-semibold">
                Sort by
              </label>
              <select
                id="sort"
                className={inputClass}
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as SortKey })}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <div
              data-testid="empty-state"
              className="mt-6 rounded-2xl border border-dashed border-control bg-surface p-8 text-center"
            >
              <h3 className="text-xl font-bold">No plans match these filters</h3>
              <p className="mt-2 text-muted">
                Try a higher price limit, fewer must-have add-ons or another insurer.
              </p>
              <button
                type="button"
                onClick={() => update(resetFilters(filters, defaults))}
                className="mt-5 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-fg hover:bg-primary-hover"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <ul className="mt-6 space-y-4" aria-label="Insurance plans" data-testid="plan-list">
              {visible.map((quote) => (
                <PlanCard
                  key={quote.id}
                  quote={quote}
                  selected={compareIds.has(quote.id)}
                  compareDisabled={full && !compareIds.has(quote.id)}
                  onToggleCompare={toggleCompare}
                />
              ))}
            </ul>
          )}
          {cheapest !== null ? (
            <p className="mt-6 text-sm text-muted">
              Lowest price in this list: {formatAED(cheapest)} a year. Prices include 5% VAT.
            </p>
          ) : null}
        </section>
      </div>

      <CompareTray
        plans={comparePlans}
        onRemove={toggleCompare}
        onClear={() => update({ compare: [] }, "replace")}
        onOpen={() => setCompareOpen(true)}
      />
      <CompareDialog
        open={compareOpen && comparePlans.length >= 2}
        plans={comparePlans}
        onClose={() => setCompareOpen(false)}
        onRemove={toggleCompare}
      />
    </div>
  );
}
