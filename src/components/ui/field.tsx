import type { ReactNode } from "react";

export const inputClass =
  "block h-11 w-full rounded-lg border border-control bg-surface px-3 text-base text-fg placeholder:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:border-2 disabled:opacity-60";

export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: (props: FieldControlProps) => ReactNode;
}

/**
 * Label + control + hint + inline error. The error and hint are wired to the control with
 * aria-describedby, and the control gets aria-invalid, so screen readers announce both.
 */
export function Field({ id, label, hint, error, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-danger">
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        className="mt-0.5 shrink-0"
      >
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

interface GroupProps {
  id: string;
  legend: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** A fieldset for radio and checkbox groups, with the same hint/error wiring as `Field`. */
export function FieldGroup({ id, legend, hint, error, children }: GroupProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset aria-describedby={describedBy} aria-invalid={Boolean(error)} className="min-w-0">
      <legend className="mb-1.5 text-sm font-semibold">{legend}</legend>
      {hint ? (
        <p id={hintId} className="mb-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}
