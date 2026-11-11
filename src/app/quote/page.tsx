import type { Metadata } from "next";
import { QuoteWizard } from "@/components/quote/quote-wizard";

export const metadata: Metadata = {
  title: "Get car insurance quotes",
  description: "Four short steps: your car, the driver, your cover and a final review.",
};

export default function QuotePage() {
  return (
    <>
      <h1 className="mx-auto max-w-2xl text-sm font-semibold uppercase tracking-wide text-muted">
        Car insurance quote
      </h1>
      <div className="mt-3">
        <QuoteWizard />
      </div>
    </>
  );
}
