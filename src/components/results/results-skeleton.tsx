/** Placeholder for the results page while quotes are "being fetched". */
export function ResultsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Finding the best prices for you...</span>
      <div className="skeleton h-9 w-72 max-w-full" />
      <div className="skeleton mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="skeleton hidden h-96 lg:block" />
        <div className="space-y-4">
          <div className="skeleton h-10 w-full max-w-xs" />
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-5">
              <div className="skeleton h-5 w-40" />
              <div className="skeleton mt-3 h-7 w-64 max-w-full" />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="skeleton h-14" />
                <div className="skeleton h-14" />
                <div className="skeleton h-14" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
