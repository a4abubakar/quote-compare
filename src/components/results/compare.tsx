"use client";

import { useEffect, useRef } from "react";
import { ADD_ON_IDS, ADD_ON_META, COVERAGE_LABELS } from "@/lib/catalog";
import { MAX_COMPARE } from "@/lib/filters";
import { formatAED, formatNumber } from "@/lib/format";
import type { Quote, QuoteAddOn } from "@/lib/pricing";

interface CompareTrayProps {
  plans: Quote[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpen: () => void;
}

/** Sticky bar at the bottom of the viewport while at least one plan is selected. */
export function CompareTray({ plans, onRemove, onClear, onOpen }: CompareTrayProps) {
  if (plans.length === 0) return null;
  return (
    <section
      aria-label="Plan comparison"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface shadow-[0_-4px_16px_rgb(0_0_0/0.12)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <p className="order-1 text-sm font-semibold" aria-live="polite">
          Comparing {plans.length} of {MAX_COMPARE}
          {plans.length < 2 ? " (pick one more)" : ""}
        </p>
        <ul className="order-3 flex min-w-0 basis-full flex-wrap gap-2 sm:order-2 sm:basis-0 sm:flex-1">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex max-w-full items-center gap-1 rounded-full border border-border bg-bg py-1 pl-3 pr-1 text-sm"
            >
              <span className="max-w-[9.5rem] truncate font-medium sm:max-w-[16rem]">{plan.planName}</span>
              <button
                type="button"
                onClick={() => onRemove(plan.id)}
                aria-label={`Remove ${plan.planName} from comparison`}
                className="flex size-7 shrink-0 items-center justify-center rounded-full hover:bg-surface-2"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold underline underline-offset-4 hover:text-primary"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onOpen}
            disabled={plans.length < 2}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            Compare plans
          </button>
        </div>
      </div>
    </section>
  );
}

function addOnCell(addOn: QuoteAddOn) {
  switch (addOn.status) {
    case "included":
      return "Included";
    case "added":
      return `Added (+${formatAED(addOn.price)})`;
    case "available":
      return "Available as an extra";
    default:
      return "Not offered";
  }
}

interface CompareDialogProps {
  open: boolean;
  plans: Quote[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

/** Side-by-side comparison in a native modal <dialog>: focus trap, Esc to close and focus return come free. */
export function CompareDialog({ open, plans, onClose, onRemove }: CompareDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const bestPremium = Math.min(...plans.map((p) => p.premium));
  const bestExcess = Math.min(...plans.map((p) => p.excess));
  const bestRating = Math.max(...plans.map((p) => p.rating));
  const best = <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-soft-fg">Best</span>;

  const rows: { label: string; cell: (p: Quote) => React.ReactNode }[] = [
    { label: "Insurer", cell: (p) => p.insurerName },
    { label: "Cover", cell: (p) => COVERAGE_LABELS[p.coverage] },
    {
      label: "Yearly premium",
      cell: (p) => (
        <>
          <strong>{formatAED(p.premium)}</strong>
          {p.premium === bestPremium && plans.length > 1 ? best : null}
        </>
      ),
    },
    { label: "Monthly", cell: (p) => `about ${formatAED(p.monthly)}` },
    {
      label: "Excess",
      cell: (p) => (
        <>
          {p.coverage === "third-party" ? "None" : formatAED(p.excess)}
          {p.excess === bestExcess && plans.length > 1 && plans.some((o) => o.excess !== p.excess) ? best : null}
        </>
      ),
    },
    {
      label: "Rating",
      cell: (p) => (
        <>
          {p.rating.toFixed(1)} / 5 ({formatNumber(p.reviews)})
          {p.rating === bestRating && plans.some((o) => o.rating !== p.rating) ? best : null}
        </>
      ),
    },
    ...ADD_ON_IDS.map((id) => ({
      label: ADD_ON_META[id].label,
      cell: (p: Quote) => addOnCell(p.addOns.find((a) => a.id === id)!),
    })),
    {
      label: "Key benefits",
      cell: (p) => (
        <ul className="list-disc space-y-1 pl-4">
          {p.benefits.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="compare-title"
      className="m-auto max-h-[92dvh] w-[min(64rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-surface p-0 text-fg shadow-2xl"
    >
      {open ? (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <h2 id="compare-title" className="text-xl font-bold tracking-tight">
              Compare plans
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg border border-control px-4 font-semibold hover:bg-surface-2"
            >
              Close
            </button>
          </div>
          <div
            className="overflow-auto px-3 py-4 sm:px-5"
            tabIndex={0}
            role="region"
            aria-label="Comparison table, scrollable"
          >
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Side-by-side comparison of the selected plans</caption>
              <thead>
                <tr>
                  <td className="sticky left-0 w-28 bg-surface p-2 sm:w-36" />
                  {plans.map((p) => (
                    <th key={p.id} scope="col" className="min-w-40 p-2 align-bottom">
                      <span className="block text-base font-bold">{p.planName}</span>
                      <button
                        type="button"
                        onClick={() => onRemove(p.id)}
                        className="mt-1 text-sm font-semibold text-primary underline underline-offset-4"
                      >
                        Remove<span className="sr-only"> {p.planName}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border align-top">
                    <th scope="row" className="sticky left-0 bg-surface p-2 font-semibold text-muted">
                      {row.label}
                    </th>
                    {plans.map((p) => (
                      <td key={p.id} className="p-2">
                        {row.cell(p)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
