import Link from "next/link";
import { sortQuotes } from "@/lib/filters";
import { formatAED } from "@/lib/format";
import { INSURERS, PLANS } from "@/lib/plans";
import { calculateQuotes } from "@/lib/pricing";

/** Fixed inputs (and a fixed "current year") so this page stays fully static. */
const exampleQuotes = sortQuotes(
  calculateQuotes(
    {
      make: "Toyota",
      model: "Camry",
      year: 2022,
      value: 85_000,
      age: 34,
      licenceYears: 12,
      claims: 0,
      coverage: "comprehensive",
      startDate: "2026-12-01",
      addOns: [],
    },
    { currentYear: 2026 },
  ).filter((q) => q.coverage === "comprehensive"),
  "price-asc",
).slice(0, 3);

const steps = [
  {
    title: "Tell us about your car",
    body: "Make, model, year and value. It takes about 30 seconds.",
  },
  {
    title: "Tell us about the driver",
    body: "Age, licence history and claims. This shapes every price you see.",
  },
  {
    title: "Pick your cover",
    body: "Comprehensive or third-party, a start date and any extras you want.",
  },
  {
    title: "Compare plans",
    body: "Filter, sort and put up to three plans side by side before you decide.",
  },
];

export default function Home() {
  return (
    <div className="space-y-16">
      <section aria-labelledby="hero-title" className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="inline-flex items-center rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary-soft-fg">
            Car insurance, UAE
          </p>
          <h1 id="hero-title" className="mt-4 text-4xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Compare car insurance quotes in minutes, not days.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Answer four short steps and see {PLANS.length} plans from {INSURERS.length} insurers, priced for
            your car and your driving record. Filter by what matters, then compare your favourites side
            by side.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/quote"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-6 text-base font-semibold text-primary-fg hover:bg-primary-hover"
            >
              Start my quote
            </Link>
            <a href="#how-it-works" className="text-base font-semibold underline underline-offset-4">
              How it works
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">No account needed. Your answers stay in your browser.</p>
        </div>

        <aside
          aria-label="Example quotes"
          className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
        >
          <p className="text-sm font-semibold text-muted">Example: 2022 Toyota Camry, driver aged 34</p>
          <ul className="mt-4 space-y-3">
            {exampleQuotes.map((quote) => (
              <li
                key={quote.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{quote.planName}</p>
                  <p className="text-sm text-muted">
                    {quote.insurerName} &middot; excess {formatAED(quote.excess)}
                  </p>
                </div>
                <p className="shrink-0 whitespace-nowrap text-lg font-bold">{formatAED(quote.premium)}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Illustrative figures from the demo data.</p>
        </aside>
      </section>

      <section id="how-it-works" aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-border bg-surface p-5">
              <span
                aria-hidden="true"
                className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-fg"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="insurers-title">
        <h2 id="insurers-title" className="text-2xl font-bold tracking-tight">
          Insurers we compare
        </h2>
        <p className="mt-2 text-muted">All fictional, all invented for this demo.</p>
        <ul className="mt-5 flex flex-wrap gap-3">
          {INSURERS.map((insurer) => (
            <li
              key={insurer.id}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
            >
              {insurer.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
