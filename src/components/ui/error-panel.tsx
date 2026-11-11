"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPanelProps {
  error: unknown;
  retry: () => void;
  title: string;
  description: string;
}

/** Shared body for `error.tsx` files. `retry` re-fetches and re-renders the failed segment. */
export function ErrorPanel({ error, retry, title, description }: ErrorPanelProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-fg hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link href="/quote" className="inline-flex h-11 items-center rounded-lg border border-control px-5 font-semibold hover:bg-surface-2">
          Edit my details
        </Link>
      </div>
    </div>
  );
}
