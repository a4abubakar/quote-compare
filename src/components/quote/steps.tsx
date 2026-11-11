"use client";

import { useMemo } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import {
  ADD_ON_IDS,
  ADD_ON_META,
  CLAIMS_OPTIONS,
  COVERAGE_DESCRIPTIONS,
  COVERAGE_LABELS,
  COVERAGE_TYPES,
  MAX_START_DAYS_AHEAD,
  MAX_VEHICLE_VALUE,
  MIN_VEHICLE_VALUE,
  OLDEST_VEHICLE_YEAR,
  VEHICLE_CATALOG,
  VEHICLE_MAKES,
} from "@/lib/catalog";
import { formatAED, formatDate } from "@/lib/format";
import { addDays, toIsoDate, type QuoteInput, type StepId } from "@/lib/schema";
import { Field, FieldGroup, inputClass } from "@/components/ui/field";

type StepProps = { form: UseFormReturn<QuoteInput> };

export function VehicleStep({ form }: StepProps) {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = form;
  const make = useWatch({ control, name: "make" });
  const models = VEHICLE_CATALOG[make] ?? [];
  const years = useMemo(() => {
    const latest = new Date().getFullYear() + 1;
    return Array.from({ length: latest - OLDEST_VEHICLE_YEAR + 1 }, (_, i) => latest - i);
  }, []);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="make" label="Make" error={errors.make?.message}>
        {(a11y) => (
          <select
            {...a11y}
            className={inputClass}
            {...register("make", { onChange: () => setValue("model", "") })}
          >
            <option value="">Select make</option>
            {VEHICLE_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field id="model" label="Model" error={errors.model?.message}>
        {(a11y) => (
          <select {...a11y} className={inputClass} {...register("model")}>
            <option value="">{make ? "Select model" : "Select a make first"}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field id="year" label="Year of manufacture" error={errors.year?.message}>
        {(a11y) => (
          <select {...a11y} className={inputClass} {...register("year", { valueAsNumber: true })}>
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        id="value"
        label="Estimated value (AED)"
        hint={`Between ${formatAED(MIN_VEHICLE_VALUE)} and ${formatAED(MAX_VEHICLE_VALUE)}. A rough market value is fine.`}
        error={errors.value?.message}
      >
        {(a11y) => (
          <input
            {...a11y}
            type="number"
            inputMode="numeric"
            placeholder="e.g. 85000"
            className={inputClass}
            {...register("value", { valueAsNumber: true })}
          />
        )}
      </Field>
    </div>
  );
}

export function DriverStep({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field id="age" label="Your age" error={errors.age?.message}>
        {(a11y) => (
          <input
            {...a11y}
            type="number"
            inputMode="numeric"
            className={inputClass}
            {...register("age", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field
        id="licenceYears"
        label="Years holding a driving licence"
        hint="Enter 0 if you got it this year."
        error={errors.licenceYears?.message}
      >
        {(a11y) => (
          <input
            {...a11y}
            type="number"
            inputMode="numeric"
            className={inputClass}
            {...register("licenceYears", { valueAsNumber: true })}
          />
        )}
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="claims"
          label="Claims in the last 3 years"
          hint="Include at-fault and not-at-fault claims."
          error={errors.claims?.message}
        >
          {(a11y) => (
            <select {...a11y} className={inputClass} {...register("claims", { valueAsNumber: true })}>
              <option value="">Select</option>
              {CLAIMS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </div>
  );
}

export function CoverageStep({ form }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const coverage = useWatch({ control, name: "coverage" });
  const { min, max } = useMemo(() => {
    const today = new Date();
    return { min: toIsoDate(today), max: toIsoDate(addDays(today, MAX_START_DAYS_AHEAD)) };
  }, []);

  return (
    <div className="space-y-7">
      <FieldGroup id="coverage" legend="Type of cover" error={errors.coverage?.message}>
        <div className="grid gap-3 sm:grid-cols-2">
          {COVERAGE_TYPES.map((type) => (
            <label
              key={type}
              className="flex cursor-pointer gap-3 rounded-xl border border-border bg-surface p-4 has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:checked]:text-primary-soft-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                value={type}
                className="mt-1 size-4 accent-primary"
                {...register("coverage")}
              />
              <span>
                <span className="block font-semibold">{COVERAGE_LABELS[type]}</span>
                <span className="mt-0.5 block text-sm opacity-90">{COVERAGE_DESCRIPTIONS[type]}</span>
              </span>
            </label>
          ))}
        </div>
      </FieldGroup>

      <div className="max-w-xs">
        <Field
          id="startDate"
          label="Policy start date"
          hint={`Within the next ${MAX_START_DAYS_AHEAD} days.`}
          error={errors.startDate?.message}
        >
          {(a11y) => (
            <input {...a11y} type="date" min={min} max={max} className={inputClass} {...register("startDate")} />
          )}
        </Field>
      </div>

      <FieldGroup
        id="addOns"
        legend="Add-ons (optional)"
        hint={
          coverage === "third-party"
            ? "Third-party plans only offer roadside assistance."
            : "Each insurer includes some of these and sells the rest. We price whatever you pick."
        }
        error={errors.addOns?.message}
      >
        <div className="space-y-2">
          {ADD_ON_IDS.map((id) => (
            <label
              key={id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 has-[:checked]:border-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring"
            >
              <input type="checkbox" value={id} className="mt-1 size-4 accent-primary" {...register("addOns")} />
              <span>
                <span className="block font-semibold">{ADD_ON_META[id].label}</span>
                <span className="block text-sm text-muted">{ADD_ON_META[id].description}</span>
              </span>
            </label>
          ))}
        </div>
      </FieldGroup>
    </div>
  );
}

export function ReviewStep({
  values,
  onEdit,
}: {
  values: Partial<QuoteInput>;
  onEdit: (step: StepId) => void;
}) {
  const claims = CLAIMS_OPTIONS.find((o) => o.value === values.claims)?.label;
  const addOns = (values.addOns ?? []).map((id) => ADD_ON_META[id].label);
  const sections: { step: StepId; title: string; rows: [string, string][] }[] = [
    {
      step: "vehicle",
      title: "Vehicle",
      rows: [
        ["Car", `${values.year ?? ""} ${values.make ?? ""} ${values.model ?? ""}`.trim()],
        ["Estimated value", values.value ? formatAED(values.value) : ""],
      ],
    },
    {
      step: "driver",
      title: "Driver",
      rows: [
        ["Age", String(values.age ?? "")],
        ["Licence held for", values.licenceYears !== undefined ? `${values.licenceYears} years` : ""],
        ["Claims (last 3 years)", claims ?? ""],
      ],
    },
    {
      step: "coverage",
      title: "Cover",
      rows: [
        ["Type", values.coverage ? COVERAGE_LABELS[values.coverage] : ""],
        ["Start date", values.startDate ? formatDate(values.startDate) : ""],
        ["Add-ons", addOns.length ? addOns.join(", ") : "None"],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.step}
          aria-labelledby={`review-${section.step}`}
          className="rounded-xl border border-border bg-bg p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id={`review-${section.step}`} className="font-semibold">
              {section.title}
            </h3>
            <button
              type="button"
              onClick={() => onEdit(section.step)}
              className="rounded-md px-2 py-1 text-sm font-semibold text-primary underline underline-offset-4 hover:text-primary-hover"
              aria-label={`Edit ${section.title.toLowerCase()} details`}
            >
              Edit
            </button>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr]">
            {section.rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <p className="text-sm text-muted">
        Nothing is sent to a server: your answers become the link to your results page.
      </p>
    </div>
  );
}
