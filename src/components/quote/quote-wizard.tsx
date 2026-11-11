"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import type { ZodType } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getDraftSnapshot,
  getServerDraftSnapshot,
  parseDraft,
  saveDraft,
  subscribeToDraft,
  type Draft,
} from "@/lib/draft";
import { serializeQuoteInput } from "@/lib/quote-params";
import {
  addDays,
  quoteSchema,
  STEP_FIELDS,
  STEP_SCHEMAS,
  toIsoDate,
  type QuoteInput,
  type StepId,
} from "@/lib/schema";
import { CoverageStep, DriverStep, ReviewStep, VehicleStep } from "./steps";
import { StepIndicator } from "./step-indicator";

const STEPS = [
  { id: "vehicle", label: "Vehicle", title: "Tell us about your car", blurb: "We use the make, age and value to set the base price." },
  { id: "driver", label: "Driver", title: "Tell us about the driver", blurb: "Experience and claims history change the price at every insurer." },
  { id: "coverage", label: "Cover", title: "Choose your cover", blurb: "Pick the type of cover, when it starts and any extras." },
  { id: "review", label: "Review", title: "Review and get quotes", blurb: "Check your answers. You can edit any section." },
] as const satisfies readonly { id: StepId; label: string; title: string; blurb: string }[];

function emptyDefaults(): Partial<QuoteInput> {
  return {
    make: "",
    model: "",
    coverage: "comprehensive",
    startDate: toIsoDate(addDays(new Date(), 1)),
    addOns: [],
  };
}

/** Skeleton shown on the server and until the saved draft has been read on the client. */
function WizardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the quote form" role="status" className="space-y-4">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton h-2 w-full" />
      <div className="skeleton h-72 w-full" />
    </div>
  );
}

/**
 * Reading sessionStorage must not happen during the server render, and hydrating with different
 * markup than the server sent is an error. useSyncExternalStore gives us both: the server (and
 * the hydration pass) see `undefined` and render the skeleton, then the client re-renders with
 * the stored draft.
 */
export function QuoteWizard() {
  const raw = useSyncExternalStore(subscribeToDraft, getDraftSnapshot, getServerDraftSnapshot);
  if (raw === undefined) return <WizardSkeleton />;
  return <WizardForm initial={parseDraft(raw)} />;
}

function WizardForm({ initial }: { initial: Draft | null }) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [step, setStep] = useState(initial?.step ?? 0);
  // The resolver reads the current step from a ref so it always validates the right schema,
  // even for a validation triggered in the same tick as a step change.
  const stepRef = useRef(step);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMovedRef = useRef(false);
  const pendingValidationRef = useRef<StepId | null>(null);

  const form = useForm<QuoteInput>({
    mode: "onTouched",
    defaultValues: { ...emptyDefaults(), ...initial?.values },
    resolver: ((values, context, options) =>
      zodResolver(STEP_SCHEMAS[STEPS[stepRef.current].id] as unknown as ZodType<QuoteInput, QuoteInput>)(
        values,
        context,
        options,
      )) as Resolver<QuoteInput>,
  });
  const { getValues, trigger, control, formState } = form;
  const watched = useWatch({ control });

  const current = STEPS[step];
  const errorNames = Object.keys(formState.errors) as (keyof QuoteInput)[];
  const errorCount = errorNames.length;
  const errorKey = errorNames.join(",");

  // "onTouched" only re-validates a field after it has been blurred, which leaves a stale message on
  // a field that was fixed by keyboard or selection. Re-check fields that currently show an error
  // whenever any value changes, so messages clear (or update) as soon as the answer is right.
  useEffect(() => {
    if (errorKey) void trigger(errorKey.split(",") as (keyof QuoteInput)[]);
  }, [watched, errorKey, trigger]);

  // Persist every change (and the current step) so a refresh restores the form.
  useEffect(() => {
    saveDraft({ step, values: watched as Partial<QuoteInput> });
  }, [step, watched]);

  // After a step change: move focus to the new step's heading, then run any pending validation.
  useEffect(() => {
    if (!hasMovedRef.current) return;
    headingRef.current?.focus();
    const pending = pendingValidationRef.current;
    if (pending) {
      pendingValidationRef.current = null;
      void trigger(STEP_FIELDS[pending] as (keyof QuoteInput)[], { shouldFocus: true });
    }
  }, [step, trigger]);

  function goTo(index: number, validateAfter?: StepId) {
    hasMovedRef.current = true;
    pendingValidationRef.current = validateAfter ?? null;
    stepRef.current = index;
    setStep(index);
  }

  async function onNext() {
    const fields = STEP_FIELDS[current.id] as (keyof QuoteInput)[];
    // Review has no fields of its own: it re-checks the whole form below.
    if (current.id !== "review") {
      const ok = await trigger(fields, { shouldFocus: true });
      if (ok) goTo(step + 1);
    }
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (current.id !== "review") return onNext();
    // Final check against the whole schema. If an earlier step is invalid (for example the start
    // date went stale while the draft sat in storage), jump back to it and show the error.
    const parsed = quoteSchema.safeParse(getValues());
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0]);
      const owner = STEPS.findIndex((s) => (STEP_FIELDS[s.id] as readonly string[]).includes(field));
      if (owner >= 0) goTo(owner, STEPS[owner].id);
      return;
    }
    const params = serializeQuoteInput(parsed.data);
    startTransition(() => router.push(`/results?${params.toString()}`));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator
        steps={STEPS}
        current={step}
        onSelect={(index) => goTo(index)}
      />

      <form
        noValidate
        onSubmit={onSubmit}
        aria-labelledby="step-title"
        className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7"
      >
        <h2
          id="step-title"
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight outline-offset-4"
        >
          {current.title}
        </h2>
        <p className="mt-1 text-muted">{current.blurb}</p>

        {/* Announces validation results without stealing focus from the first invalid field. */}
        <p role="status" aria-live="polite" className="sr-only">
          {errorCount > 0
            ? `${errorCount} ${errorCount === 1 ? "field needs" : "fields need"} your attention.`
            : ""}
        </p>

        <div className="mt-6" key={current.id}>
          {current.id === "vehicle" && <VehicleStep form={form} />}
          {current.id === "driver" && <DriverStep form={form} />}
          {current.id === "coverage" && <CoverageStep form={form} />}
          {current.id === "review" && <ReviewStep values={getValues()} onEdit={(id) => goTo(STEPS.findIndex((s) => s.id === id))} />}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="inline-flex h-12 items-center justify-center rounded-lg border border-control px-5 font-semibold hover:bg-surface-2"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={isNavigating}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-fg hover:bg-primary-hover disabled:opacity-70"
          >
            {current.id === "review"
              ? isNavigating
                ? "Finding your quotes..."
                : "Get my quotes"
              : "Next"}
          </button>
        </div>
      </form>
    </div>
  );
}
