import { test, expect, type Page } from "@playwright/test";
import { createBrandReview } from "../lib/brand-review";
import { demoCampaign } from "../lib/mock";
import type { Brand } from "../lib/schemas";

const source = "Willow is a thoughtful accessories brand for creative people.";
const brand: Brand = {
  name: "Willow",
  personality: "Thoughtful",
  positioning: "Accessories for creative people",
  audience: "Creative people",
  tone: "Warm",
  values: "Care",
  messages: "Considered accessories",
  colors: "Sage",
  visual: "Natural light",
};
const evidence = Object.fromEntries(
  Object.keys(brand).map((key) => [key, source]),
);
const analysis = (value = brand) => ({
  brand: value,
  evidence,
  review: createBrandReview(value, evidence),
  demo: false,
  truncated: false,
});

async function upload(page: Page, name: string) {
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from(source),
    });
}

test("Brand review removes stale evidence, requires reapproval, and sends explicit missing values", async ({
  page,
}) => {
  await page.route("**/api/brand", (route) =>
    route.fulfill({ json: analysis() }),
  );
  let submittedBrand: Brand | undefined;
  await page.route("**/api/campaign", async (route) => {
    const input = route.request().postDataJSON();
    submittedBrand = input.brand;
    await route.fulfill({
      json: { campaign: demoCampaign(input.brand, input.product), demo: true },
    });
  });
  await page.goto("/");
  await upload(page, "willow.txt");
  await page.getByRole("button", { name: "Analyze brand" }).click();
  const tone = page.getByTestId("brand-field-tone");
  await expect(tone).toContainText("Document extraction — review support");
  await expect(tone).toContainText(`Source quote: “${source}”`);
  await expect(
    page.getByText("A matching document quote locates the source", {
      exact: false,
    }),
  ).toBeVisible();

  await page
    .getByLabel("Tone of voice", { exact: true })
    .fill("Direct and friendly");
  await expect(tone).toContainText("User supplied — not document evidence");
  await expect(tone).not.toContainText("Source quote:");
  await page
    .getByRole("button", { name: "Restore extracted tone of voice" })
    .click();
  await expect(page.getByLabel("Tone of voice", { exact: true })).toHaveValue(
    "Warm",
  );
  await expect(tone).toContainText("Source quote:");
  await page
    .getByLabel("Tone of voice", { exact: true })
    .fill("Direct and friendly");
  await page.getByLabel("Brand colors", { exact: true }).fill("");
  await expect(page.getByTestId("brand-field-colors")).toContainText(
    "Missing — not specified",
  );
  await expect(
    page.getByRole("button", { name: /Your product/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Approve brand & continue" }).click();
  await page.getByRole("button", { name: /Brand Brain/ }).click();
  await expect(page.getByLabel("Brand colors", { exact: true })).toHaveValue(
    "Not specified in document",
  );
  await page.getByLabel("Brand name", { exact: true }).fill("Willow Studio");
  await expect(
    page.getByRole("button", { name: /Your product/ }),
  ).toBeDisabled();
  await expect(
    page.getByText("Review required before campaign generation.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Approve brand & continue" }).click();
  await page.getByLabel("Product name *", { exact: true }).fill("Canvas Tote");
  await page
    .getByLabel("Description *", { exact: true })
    .fill("A cotton tote with an internal pocket.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Generate my campaign" }).click();
  await expect(page.getByLabel("Campaign name", { exact: true })).toBeVisible();
  expect(submittedBrand?.name).toBe("Willow Studio");
  expect(submittedBrand?.tone).toBe("Direct and friendly");
  expect(submittedBrand?.colors).toBe("Not specified in document");
});

test("failed replacement preserves the prior draft and successful replacement resets provenance", async ({
  page,
}) => {
  let count = 0;
  await page.route("**/api/brand", async (route) => {
    count++;
    if (count === 2) {
      await route.fulfill({
        status: 422,
        json: { error: "This replacement cannot be read." },
      });
    } else {
      await route.fulfill({
        json: analysis(
          count === 1
            ? brand
            : { ...brand, name: "Cedar", colors: "Not specified in document" },
        ),
      });
    }
  });
  await page.goto("/");
  await upload(page, "willow.txt");
  await page.getByRole("button", { name: "Analyze brand" }).click();
  await page
    .getByLabel("Tone of voice", { exact: true })
    .fill("My reviewed tone");
  await upload(page, "unreadable.txt");
  await expect(
    page.getByText("Showing the previous analysis for willow.txt.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Approve brand & continue" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Analyze brand" }).click();
  await expect(page.locator(".error[role=alert]")).toContainText(
    "This replacement cannot be read.",
  );
  await expect(page.getByLabel("Tone of voice", { exact: true })).toHaveValue(
    "My reviewed tone",
  );
  await expect(page.getByTestId("brand-field-tone")).toContainText(
    "User supplied — not document evidence",
  );
  await page.getByRole("button", { name: "Keep previous analysis" }).click();
  await expect(
    page.getByRole("button", { name: "Approve brand & continue" }),
  ).toBeEnabled();
  await upload(page, "cedar.txt");
  await page.getByRole("button", { name: "Analyze brand" }).click();
  await expect(page.getByLabel("Brand name", { exact: true })).toHaveValue(
    "Cedar",
  );
  await expect(page.getByLabel("Tone of voice", { exact: true })).toHaveValue(
    "Warm",
  );
  await expect(page.getByTestId("brand-field-tone")).toContainText(
    "Document extraction — review support",
  );
  await expect(page.getByTestId("brand-field-colors")).toContainText(
    "Missing — not specified",
  );
  await expect(
    page.getByRole("button", { name: /Your product/ }),
  ).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
