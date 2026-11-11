import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DRAFT_STORAGE_KEY } from "@/lib/draft";
import { QuoteWizard } from "./quote-wizard";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("QuoteWizard", () => {
  it("blocks Next on an invalid step, explains why, and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<QuoteWizard />);

    await user.click(screen.getByRole("button", { name: "Next" }));

    // Still on step 1, with accessible inline errors.
    expect(screen.getByRole("heading", { name: "Tell us about your car" })).toBeInTheDocument();
    const make = screen.getByLabelText("Make");
    expect(make).toHaveAttribute("aria-invalid", "true");
    expect(make).toHaveAccessibleDescription("Select the make of your car");
    expect(make).toHaveFocus();
    expect(screen.getByLabelText("Estimated value (AED)")).toHaveAccessibleDescription(
      /Enter the estimated value of your car in AED/,
    );
    expect(screen.getByRole("status")).toHaveTextContent("4 fields need your attention.");
  });

  it("moves to the next step once the current one is valid, clears errors as they are fixed, and saves a draft", async () => {
    const user = userEvent.setup();
    render(<QuoteWizard />);

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.selectOptions(screen.getByLabelText("Make"), "Toyota");
    await user.selectOptions(screen.getByLabelText("Model"), "Camry");
    // The make's error clears as soon as the answer is valid, without needing a blur.
    expect(screen.getByLabelText("Make")).toHaveAttribute("aria-invalid", "false");

    await user.selectOptions(screen.getByLabelText("Year of manufacture"), "2022");
    await user.type(screen.getByLabelText("Estimated value (AED)"), "85000");
    await user.click(screen.getByRole("button", { name: "Next" }));

    const heading = await screen.findByRole("heading", { name: "Tell us about the driver" });
    expect(heading).toHaveFocus();
    expect(screen.getByTestId("step-counter")).toHaveTextContent("Step 2 of 4");

    const saved = JSON.parse(window.sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? "{}");
    expect(saved.step).toBe(1);
    expect(saved.values).toMatchObject({ make: "Toyota", model: "Camry", year: 2022, value: 85000 });
  });

  it("restores the step and answers from sessionStorage after a refresh", () => {
    window.sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ step: 1, values: { make: "Kia", model: "Sportage", year: 2020, value: 60000, age: 41 } }),
    );
    render(<QuoteWizard />);

    expect(screen.getByRole("heading", { name: "Tell us about the driver" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your age")).toHaveValue(41);
  });
});
