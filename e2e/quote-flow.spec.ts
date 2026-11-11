import { expect, test, type Page } from "@playwright/test";

const premiums = async (page: Page) =>
  (await page.getByTestId("plan-card").evaluateAll((cards) => cards.map((c) => Number(c.getAttribute("data-premium")))));

const isSorted = (values: number[], dir: "asc" | "desc") =>
  values.every((v, i) => i === 0 || (dir === "asc" ? values[i - 1] <= v : values[i - 1] >= v));

test("fill the quote form, see results, filter, sort and compare", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start my quote" }).first().click();
  await expect(page.getByRole("heading", { name: "Tell us about your car" })).toBeVisible();
  await expect(page.getByTestId("step-counter")).toHaveText("Step 1 of 4");

  // Step 1: validation blocks Next and focus moves to the first invalid field.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Select the make of your car")).toBeVisible();
  await expect(page.getByLabel("Make")).toBeFocused();
  await expect(page.getByLabel("Make")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Make")).toHaveAccessibleDescription("Select the make of your car");

  await page.getByLabel("Make").selectOption("Toyota");
  await page.getByLabel("Model").selectOption("Camry");
  await page.getByLabel("Year of manufacture").selectOption("2022");
  await page.getByLabel("Estimated value (AED)").fill("85000");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 2: refresh mid-way, the draft survives in sessionStorage.
  await expect(page.getByRole("heading", { name: "Tell us about the driver" })).toBeFocused();
  await page.getByLabel("Your age").fill("34");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tell us about the driver" })).toBeVisible();
  await expect(page.getByLabel("Your age")).toHaveValue("34");

  // A licence can't be older than the driver allows.
  await page.getByLabel("Years holding a driving licence").fill("40");
  await page.getByLabel("Claims in the last 3 years").selectOption({ label: "No claims" });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText(/held a licence for 40 years at age 34/)).toBeVisible();
  await page.getByLabel("Years holding a driving licence").fill("12");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 3: cover, start date and add-ons.
  await expect(page.getByRole("heading", { name: "Choose your cover" })).toBeVisible();
  await expect(page.getByLabel(/^Comprehensive/)).toBeChecked();
  await page.getByLabel("Roadside assistance").check();
  await page.getByLabel("Rental car").check();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 4: review shows what we entered, with a way back.
  await expect(page.getByRole("heading", { name: "Review and get quotes" })).toBeVisible();
  await expect(page.getByText("2022 Toyota Camry")).toBeVisible();
  await expect(page.getByText("AED 85,000")).toBeVisible();
  await expect(page.getByText("Roadside assistance, Rental car")).toBeVisible();
  await page.getByRole("button", { name: "Get my quotes" }).click();

  // Results: the skeleton shows first (the pricing call is slowed down on purpose).
  await expect(page.getByRole("status").filter({ hasText: "Finding the best prices" })).toBeVisible();
  await expect(page).toHaveURL(/\/results\?/);
  await expect(page.getByRole("heading", { name: "Your car insurance quotes" })).toBeVisible();
  await expect(page.getByTestId("plan-card")).toHaveCount(10); // the 10 comprehensive plans
  expect(isSorted(await premiums(page), "asc")).toBe(true);

  // Filter by insurer: URL updates, list shrinks.
  await page.getByLabel("Pearl Coast Assurance").check();
  await expect(page).toHaveURL(/insurer=pearl-coast/);
  await expect(page.getByTestId("plan-card")).toHaveCount(2);

  // Sort by price, high to low, and verify the order.
  await page.getByLabel("Sort by").selectOption("price-desc");
  await expect(page).toHaveURL(/sort=price-desc/);
  const desc = await premiums(page);
  expect(desc).toHaveLength(2);
  expect(isSorted(desc, "desc")).toBe(true);
  expect(desc[0]).toBeGreaterThan(desc[1]);

  // Widen to every insurer and all cover types, then sort by rating.
  await page.getByLabel("Pearl Coast Assurance").uncheck();
  await page.getByLabel("All types").check();
  await expect(page.getByTestId("plan-card")).toHaveCount(15);
  await page.getByLabel("Sort by").selectOption("price-asc");
  const asc = await premiums(page);
  expect(isSorted(asc, "asc")).toBe(true);

  // Back button steps through filter history.
  await page.goBack();
  await expect(page.getByLabel("Sort by")).toHaveValue("price-desc");

  // Compare two plans in the dialog.
  const cards = page.getByTestId("plan-card");
  await cards.nth(0).getByLabel("Compare").check();
  await cards.nth(1).getByLabel("Compare").check();
  await expect(page.getByText("Comparing 2 of 3")).toBeVisible();
  await page.getByRole("button", { name: "Compare plans" }).click();
  const dialog = page.getByRole("dialog", { name: "Compare plans" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("columnheader")).toHaveCount(2);
  await expect(dialog.getByRole("rowheader", { name: "Yearly premium" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // Empty state: contradictory filters, then reset.
  await page.getByLabel("Sandbar Direct").check();
  await page.getByLabel("Rental car").check();
  await expect(page.getByTestId("empty-state")).toBeVisible();
  await page.getByTestId("empty-state").getByRole("button", { name: "Reset filters" }).click();
  await expect(page.getByTestId("empty-state")).toBeHidden();
  await expect(page.getByTestId("plan-card").first()).toBeVisible();
});

test("shows an error state with a retry button when pricing fails", async ({ page }) => {
  await page.goto(
    "/results?make=Toyota&model=Camry&year=2022&value=85000&age=34&licence=12&claims=0&cover=comprehensive&start=2030-01-01&fail=1",
  );
  await expect(page.getByRole("heading", { name: "We couldn't load your quotes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("a results link with missing details asks the user to start a quote", async ({ page }) => {
  await page.goto("/results?make=Toyota");
  await expect(page.getByRole("heading", { name: "We need a few details first" })).toBeVisible();
});
