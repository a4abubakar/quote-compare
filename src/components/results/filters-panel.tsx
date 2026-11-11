"use client";

import { ADD_ON_IDS, ADD_ON_META, COVERAGE_LABELS, COVERAGE_TYPES, type AddOnId } from "@/lib/catalog";
import type { CoverageFilter, Filters } from "@/lib/filters";
import { formatAED } from "@/lib/format";
import { INSURERS } from "@/lib/plans";

interface FiltersPanelProps {
  filters: Filters;
  bounds: { min: number; max: number };
  hasActive: boolean;
  onChange: (patch: Partial<Filters>, mode?: "push" | "replace") => void;
  onReset: () => void;
}

const COVERAGE_OPTIONS: { value: CoverageFilter; label: string }[] = [
  { value: "all", label: "All types" },
  ...COVERAGE_TYPES.map((t) => ({ value: t, label: COVERAGE_LABELS[t] })),
];

const toggle = <T,>(list: T[], item: T) =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export function FiltersPanel({ filters, bounds, hasActive, onChange, onReset }: FiltersPanelProps) {
  const cap = Math.min(Math.max(filters.maxPremium ?? bounds.max, bounds.min), bounds.max);

  return (
    <form
      aria-label="Filter quotes"
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6 rounded-2xl border border-border bg-surface p-5"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Type of cover</legend>
        <div className="space-y-2">
          {COVERAGE_OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name="coverage-filter"
                className="size-4 accent-primary"
                checked={filters.coverage === o.value}
                onChange={() => onChange({ coverage: o.value })}
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="max-premium" className="mb-2 flex items-baseline justify-between gap-2 text-sm font-semibold">
          <span>Max yearly premium</span>
          <output htmlFor="max-premium" className="font-bold">
            {filters.maxPremium === null ? "No limit" : formatAED(cap)}
          </output>
        </label>
        <input
          id="max-premium"
          type="range"
          className="w-full"
          min={bounds.min}
          max={bounds.max}
          step={100}
          value={cap}
          aria-valuetext={filters.maxPremium === null ? "No limit" : formatAED(cap)}
          onChange={(e) => {
            const value = Number(e.target.value);
            onChange({ maxPremium: value >= bounds.max ? null : value }, "replace");
          }}
        />
        <div className="flex justify-between text-xs text-muted" aria-hidden="true">
          <span>{formatAED(bounds.min)}</span>
          <span>{formatAED(bounds.max)}</span>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Insurer</legend>
        <div className="space-y-2">
          {INSURERS.map((insurer) => (
            <label key={insurer.id} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={filters.insurers.includes(insurer.id)}
                onChange={() => onChange({ insurers: toggle(filters.insurers, insurer.id) })}
              />
              {insurer.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset aria-describedby="must-hint">
        <legend className="mb-1 text-sm font-semibold">Must-have add-ons</legend>
        <p id="must-hint" className="mb-2 text-sm text-muted">
          Included in the plan, or added in your quote.
        </p>
        <div className="space-y-2">
          {ADD_ON_IDS.map((id: AddOnId) => (
            <label key={id} className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={filters.mustHave.includes(id)}
                onChange={() => onChange({ mustHave: toggle(filters.mustHave, id) })}
              />
              {ADD_ON_META[id].label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onReset}
        disabled={!hasActive}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-control font-semibold hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Reset filters
      </button>
    </form>
  );
}
