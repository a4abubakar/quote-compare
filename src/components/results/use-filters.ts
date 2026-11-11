"use client";

import { useSearchParams } from "next/navigation";
import { startTransition, useCallback, useMemo, useOptimistic } from "react";
import {
  applyFiltersToParams,
  parseFilters,
  type FilterDefaults,
  type Filters,
} from "@/lib/filters";

/**
 * Filter, sort and compare state lives in the URL, so a results page is a shareable link and the
 * back button steps through filter changes.
 *
 * Updates go through the native History API (which Next.js integrates with `useSearchParams`)
 * instead of `router.push`: the URL changes and every consumer re-renders, but the server
 * component, and its artificial latency, is not re-run for what is purely client-side filtering.
 */
export function useFilters(defaults: FilterDefaults) {
  const searchParams = useSearchParams();
  const urlFilters = useMemo(() => parseFilters(searchParams, defaults), [searchParams, defaults]);
  // Next applies pushState/replaceState to its router state in a transition, so the URL (and
  // useSearchParams) lag the click by a beat. Showing the next state optimistically keeps controlled
  // inputs from snapping back for that moment; it settles to the URL's value once the transition ends.
  const [filters, setOptimisticFilters] = useOptimistic(urlFilters);

  const update = useCallback(
    (patch: Partial<Filters>, mode: "push" | "replace" = "push") => {
      const current = new URLSearchParams(window.location.search);
      const next = { ...parseFilters(current, defaults), ...patch };
      const params = applyFiltersToParams(current, next, defaults);
      const url = `${window.location.pathname}?${params.toString()}`;
      startTransition(() => {
        setOptimisticFilters(parseFilters(params, defaults));
        if (mode === "push") window.history.pushState(null, "", url);
        else window.history.replaceState(null, "", url);
      });
    },
    [defaults, setOptimisticFilters],
  );

  return { filters, update };
}
