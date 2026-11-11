import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { resetDraftCache } from "@/lib/draft";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
  resetDraftCache();
});
