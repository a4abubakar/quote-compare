import { memo } from "react";
import { ADD_ON_META, COVERAGE_LABELS } from "@/lib/catalog";
import { formatAED, formatNumber } from "@/lib/format";
import type { Quote, QuoteAddOn } from "@/lib/pricing";

function addOnText(addOn: QuoteAddOn): { text: string; tone: "good" | "neutral" | "bad" } {
  const label = ADD_ON_META[addOn.id].label;
  switch (addOn.status) {
    case "included":
      return { text: `${label}: included`, tone: "good" };
    case "added":
      return { text: `${label}: +${formatAED(addOn.price)}`, tone: "good" };
    case "unavailable":
      return { text: `${label}: not offered`, tone: "bad" };
    default:
      return { text: `${label}: available`, tone: "neutral" };
  }
}

interface PlanCardProps {
  quote: Quote;
  selected: boolean;
  /** True when three plans are already selected and this one is not among them. */
  compareDisabled: boolean;
  onToggleCompare: (id: string) => void;
}

function PlanCardImpl({ quote, selected, compareDisabled, onToggleCompare }: PlanCardProps) {
  const titleId = `plan-${quote.id}-title`;
  const hintId = `plan-${quote.id}-hint`;

  return (
    <li>
      <article
        aria-labelledby={titleId}
        data-testid="plan-card"
        data-plan-id={quote.id}
        data-premium={quote.premium}
        className={[
          "rounded-2xl border bg-surface p-5 shadow-sm sm:p-6",
          selected ? "border-primary ring-2 ring-primary" : "border-border",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">{quote.insurerName}</p>
            <h3 id={titleId} className="mt-0.5 text-xl font-bold tracking-tight">
              {quote.planName}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-semibold text-primary-soft-fg">
                {COVERAGE_LABELS[quote.coverage]}
              </span>
              <span className="font-medium" data-testid="rating">
                <span aria-hidden="true" className="text-accent">
                  ★
                </span>{" "}
                <span className="sr-only">Rated </span>
                {quote.rating.toFixed(1)}
                <span className="sr-only"> out of 5</span>{" "}
                <span className="text-muted">
                  ({formatNumber(quote.reviews)}
                  <span className="sr-only"> reviews</span>)
                </span>
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-extrabold tracking-tight" data-testid="premium">
              {formatAED(quote.premium)}
              <span className="text-base font-semibold text-muted"> /year</span>
            </p>
            <p className="text-sm text-muted">or about {formatAED(quote.monthly)} a month</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:max-w-md">
          <div className="rounded-lg bg-bg px-3 py-2">
            <dt className="text-muted">Excess</dt>
            <dd className="font-semibold" data-testid="excess">
              {quote.coverage === "third-party" ? "None" : formatAED(quote.excess)}
            </dd>
          </div>
          <div className="rounded-lg bg-bg px-3 py-2">
            <dt className="text-muted">Price includes</dt>
            <dd className="font-semibold">5% VAT</dd>
          </div>
        </dl>

        <ul className="mt-5 space-y-1.5 text-sm">
          {quote.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-success">
                <path d="m5 12.500 4.500 4.500L19 7.500" />
              </svg>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <ul aria-label="Add-ons" className="mt-4 flex flex-wrap gap-2 text-xs">
          {quote.addOns.map((addOn) => {
            const { text, tone } = addOnText(addOn);
            return (
              <li
                key={addOn.id}
                className={[
                  "rounded-full border px-2.5 py-1 font-medium",
                  tone === "good" && "border-success text-success",
                  tone === "bad" && "border-danger text-danger",
                  tone === "neutral" && "border-border text-muted",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {text}
              </li>
            );
          })}
        </ul>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-semibold text-primary hover:text-primary-hover">
            How this price is worked out
          </summary>
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-lg bg-bg p-3">
            <dt className="text-muted">Base premium for your car</dt>
            <dd className="text-right font-medium">{formatAED(quote.breakdown.base)}</dd>
            <dt className="text-muted">Vehicle age factor</dt>
            <dd className="text-right font-medium">x {quote.breakdown.vehicleAgeFactor.toFixed(2)}</dd>
            <dt className="text-muted">Driver risk factor</dt>
            <dd className="text-right font-medium">x {quote.breakdown.driverRiskFactor.toFixed(2)}</dd>
            <dt className="text-muted">Add-ons you chose</dt>
            <dd className="text-right font-medium">{formatAED(quote.breakdown.addOns)}</dd>
            <dt className="text-muted">VAT (5%)</dt>
            <dd className="text-right font-medium">{formatAED(quote.breakdown.vat)}</dd>
          </dl>
        </details>

        <div className="mt-5 border-t border-border pt-4">
          <label className="inline-flex cursor-pointer items-center gap-2.5 font-semibold has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={selected}
              disabled={compareDisabled}
              aria-describedby={compareDisabled ? hintId : undefined}
              onChange={() => onToggleCompare(quote.id)}
            />
            <span>
              Compare<span className="sr-only"> {quote.planName}</span>
            </span>
          </label>
          {compareDisabled ? (
            <p id={hintId} className="mt-1 text-sm text-muted">
              You can compare up to 3 plans. Remove one to add this plan.
            </p>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export const PlanCard = memo(PlanCardImpl);
