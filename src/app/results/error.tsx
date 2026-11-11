"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function ResultsError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel
      error={error}
      retry={retry}
      title="We couldn't load your quotes"
      description="Our (pretend) pricing service didn't respond. Your answers are safe, so you can try again or edit them."
    />
  );
}
