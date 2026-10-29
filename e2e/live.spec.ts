import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("live-mode UI and routes with mock FAL: grounded brand, paired ads, partial regeneration, image failure and usage cap", async ({
  request,
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByText("AI-powered studio", { exact: true }),
  ).toBeVisible();
  const doc =
    "Cinder makes handmade ceramic cups. Our personality is warm and practical. Our tone is clear and calm. No colors or audience are documented.";
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "cinder.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(doc),
    });
  const analysis = page.waitForResponse((r) => r.url().endsWith("/api/brand"));
  await page.getByRole("button", { name: "Analyze brand" }).click();
  const result = await (await analysis).json();
  const brand = result.brand;
  expect(result.demo).toBe(false);
  expect(brand.name).toBe("Cinder");
  await expect(
    page.getByText("Document evidence:", { exact: false }).first(),
  ).toBeVisible();
  await expect(page.getByLabel("Brand colors", { exact: true })).toHaveValue(
    "Not specified in document",
  );
  await page.getByRole("button", { name: "Approve brand & continue" }).click();
  const product = {
    name: "Cinder Cup",
    description: "A handmade ceramic espresso cup",
    features: "Matte glaze",
    benefits: "A comfortable grip",
    price: "",
  };
  await page.getByLabel("Product name *", { exact: true }).fill(product.name);
  await page
    .getByLabel("Description *", { exact: true })
    .fill(product.description);
  await page.getByLabel("Key features", { exact: true }).fill(product.features);
  await page
    .getByLabel("Customer benefits", { exact: true })
    .fill(product.benefits);
  await page
    .locator("input[type=file]")
    .setInputFiles("e2e/fixtures/product.png");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const strategy = page.waitForResponse((r) =>
    r.url().endsWith("/api/campaign"),
  );
  await page.getByRole("button", { name: "Generate my campaign" }).click();
  const { campaign } = await (await strategy).json();
  expect(
    new Set(campaign.posts.map((p: { headline: string }) => p.headline)).size,
  ).toBe(3);
  for (const type of ["Hero", "Lifestyle", "Creative"]) {
    await expect(
      page.getByRole("img", { name: `${type} advertising image` }),
    ).toBeVisible();
  }
  await expect(
    page.getByRole("button", { name: "Regenerate Hero image" }),
  ).toBeEnabled();
  await expect(
    page.getByText("AI-generated · review product and branding accuracy."),
  ).toHaveCount(3);
  await expect(
    page.getByText("Demo reference only", { exact: false }),
  ).toHaveCount(0);
  const originalCaption = await page
    .getByLabel("Post 1 caption", { exact: true })
    .inputValue();
  await page
    .getByRole("button", { name: "Regenerate post0.headline", exact: true })
    .click();
  await expect(
    page.getByLabel("Post 1 headline", { exact: true }),
  ).not.toHaveValue(campaign.posts[0].headline);
  await expect(page.getByLabel("Post 1 caption", { exact: true })).toHaveValue(
    originalCaption,
  );
  await expect(page.getByLabel("Post 2 headline", { exact: true })).toHaveValue(
    campaign.posts[1].headline,
  );
  const png = await readFile("e2e/fixtures/product.png");
  const response = await request.post("/api/images", {
    multipart: {
      metadata: JSON.stringify({
        brand,
        product,
        index: 0,
        ad: campaign.posts[0],
        visual: { ...campaign.visuals[0], prompt: "__MOCK_IMAGE_FAIL__" },
      }),
      image: { name: "product.png", mimeType: "image/png", buffer: png },
    },
  });
  expect(response.status()).toBe(429);
  expect((await response.json()).error).toContain("billing");
  await page.getByRole("button", { name: "Regenerate Hero image" }).click();
  await expect(page.locator(".image-error")).toContainText("limit reached");
  await expect(page.locator(".image-error")).toContainText(
    "previous image is still available",
  );
  await expect(
    page.getByRole("img", { name: "Hero advertising image" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Lifestyle advertising image" }),
  ).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Hero image" }).click();
  expect((await downloaded).suggestedFilename()).toBe("forma-hero.png");
  const status = await (await request.get("/api/status")).json();
  expect(status.imagesRemaining).toBe(0);
});
