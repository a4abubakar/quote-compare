"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <ErrorPanel
      error={error}
      retry={retry}
      title="Something went wrong"
      description="An unexpected error stopped this page from loading. Trying again usually fixes it."
    />
  );
}
