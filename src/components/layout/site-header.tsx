import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <path d="M32 11 50 18v14c0 11-7.6 18.5-18 22C21.6 50.5 14 43 14 32V18l18-7Z" className="fill-primary-fg" />
      <path d="M32 21 38 32 32 43 26 32Z" className="fill-primary" />
      <circle cx="32" cy="32" r="2.6" className="fill-primary-fg" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Logo />
          <span>Compass Cover</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/quote"
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
          >
            Get quotes
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
