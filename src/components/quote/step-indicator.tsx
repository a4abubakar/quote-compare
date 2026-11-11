interface StepIndicatorProps {
  steps: readonly { id: string; label: string }[];
  /** Zero-based index of the current step. */
  current: number;
  onSelect: (index: number) => void;
}

/**
 * Progress for the wizard. Past steps are buttons (go back and edit), the current step is
 * marked with aria-current="step", and a progressbar summarises "step N of M" for assistive tech.
 */
export function StepIndicator({ steps, current, onSelect }: StepIndicatorProps) {
  const total = steps.length;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-muted" data-testid="step-counter">
          Step {current + 1} of {total}
        </p>
        <p className="text-sm font-semibold">{steps[current].label}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Quote progress"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-valuetext={`Step ${current + 1} of ${total}: ${steps[current].label}`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300"
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
      <nav aria-label="Quote steps" className="mt-4">
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            const label = (
              <>
                <span
                  aria-hidden="true"
                  className={[
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    done || active ? "bg-primary text-primary-fg" : "border border-control text-muted",
                  ].join(" ")}
                >
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.500 4.500L19 7.500" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={["hidden text-sm sm:inline", active ? "font-semibold" : "text-muted"].join(" ")}>
                  {step.label}
                </span>
                {done ? <span className="sr-only">(completed)</span> : null}
              </>
            );
            return (
              <li
                key={step.id}
                aria-current={active ? "step" : undefined}
                className="flex items-center"
              >
                {done ? (
                  <button
                    type="button"
                    onClick={() => onSelect(index)}
                    className="flex items-center gap-2 rounded-lg p-1 text-left hover:bg-surface-2"
                    aria-label={`Go back to ${step.label}`}
                  >
                    {label}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-1">{label}</div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
