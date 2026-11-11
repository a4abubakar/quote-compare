import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center">
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">We can&apos;t find that page</h1>
      <p className="mt-2 text-muted">The link may be old or mistyped.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-primary-fg hover:bg-primary-hover"
      >
        Back to the start
      </Link>
    </div>
  );
}
