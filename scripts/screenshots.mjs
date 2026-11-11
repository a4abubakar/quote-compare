/**
 * Captures the README screenshots (light + dark, desktop + mobile) from a running dev server.
 *   npm run dev          (in one terminal, port 3001)
 *   npm run screenshots  (in another)
 *
 * Uses the installed Edge because Playwright's bundled headless shell can't launch on the author's
 * machine. On CI or other machines, delete the `channel` option to use Playwright's own Chromium.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const devices = {
  desktop: { viewport: { width: 1280, height: 800 }, isMobile: false },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true },
};

const isoDate = (offsetDays) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
const draft = (step) => ({
  step,
  values: {
    make: "Toyota",
    model: "Camry",
    year: 2022,
    value: 85000,
    age: 34,
    licenceYears: 12,
    claims: 0,
    coverage: "comprehensive",
    startDate: isoDate(3),
    addOns: ["roadside", "rental"],
  },
});

const browser = await chromium.launch({ channel: "msedge" });

for (const scheme of ["light", "dark"]) {
  for (const [deviceName, device] of Object.entries(devices)) {
    const context = await browser.newContext({
      viewport: device.viewport,
      isMobile: device.isMobile,
      hasTouch: device.isMobile,
      deviceScaleFactor: device.isMobile ? 2 : 1,
      colorScheme: scheme,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const shot = (name, options = {}) =>
      page.screenshot({ path: `${OUT}${name}-${scheme}-${deviceName}.png`, ...options });

    // Landing
    await page.goto(`${BASE}/`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await shot("home");

    // Quote form, coverage step with a validation error visible
    await page.goto(`${BASE}/quote`);
    await page.evaluate((d) => sessionStorage.setItem("qc-quote-draft", JSON.stringify(d)), draft(2));
    await page.reload();
    await page.getByRole("heading", { name: "Choose your cover" }).waitFor();
    await page.getByLabel("Policy start date").fill(isoDate(-1));
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByText("The start date can't be in the past").waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot("quote", { fullPage: true });

    // Results (through the real submit), with two plans selected for comparison
    await page.evaluate((d) => sessionStorage.setItem("qc-quote-draft", JSON.stringify(d)), draft(3));
    await page.reload();
    await page.getByRole("button", { name: "Get my quotes" }).click();
    await page.getByTestId("plan-card").first().waitFor();
    await page.getByTestId("plan-card").nth(0).getByLabel("Compare").check();
    await page.getByTestId("plan-card").nth(2).getByLabel("Compare").check();
    await page.getByText("Comparing 2 of 3").waitFor();
    await page.evaluate(() => window.scrollTo(0, 0));
    await shot("results");

    // Compare dialog
    await page.getByRole("button", { name: "Compare plans" }).click();
    await page.getByRole("dialog", { name: "Compare plans" }).waitFor();
    await shot("compare");

    await context.close();
  }
}

// A skeleton frame: slow the pricing call down just for this shot is not needed because the
// server already waits ~0.9s, so grab it mid-flight.
{
  const context = await browser.newContext({ viewport: devices.desktop.viewport, colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(`${BASE}/quote`);
  await page.evaluate((d) => sessionStorage.setItem("qc-quote-draft", JSON.stringify(d)), draft(3));
  await page.reload();
  await page.getByRole("button", { name: "Get my quotes" }).click();
  await page.getByRole("status").filter({ hasText: "Finding the best prices" }).waitFor();
  await page.screenshot({ path: `${OUT}loading-light-desktop.png` });
  await context.close();
}

await browser.close();
console.log(`Screenshots written to ${OUT}`);
