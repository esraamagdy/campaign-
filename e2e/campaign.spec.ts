import { test, expect } from "@playwright/test";

test("complete demo campaign workflow, editing, and targeted regeneration", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.screenshot({ path: "/tmp/forma-desktop.png", fullPage: true });
  await expect(
    page.getByRole("heading", { name: "Your brand. Your next big campaign." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyze brand" }),
  ).toBeDisabled();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "brand.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Willow is a thoughtful accessories brand. We make practical, beautiful essentials for creative people. Our voice is warm and calm. Our colors are sage and cream.",
      ),
    });
  await page.getByRole("button", { name: "Analyze brand" }).click();
  await expect(page.getByText("Demo AI · illustrative analysis")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Brand name", exact: true })
    .fill("Willow");
  await page.getByRole("button", { name: "Approve brand & continue" }).click();
  await page
    .getByLabel("Product name *", { exact: true })
    .fill("Everyday Tote");
  await page
    .getByLabel("Description *", { exact: true })
    .fill("A cotton bag with a large internal pocket.");
  await page
    .getByLabel("Customer benefits", { exact: true })
    .fill("Keep essentials organized.");
  await page.locator("input[type=file]").setInputFiles({
    name: "product.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGN8AAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.getByRole("img", { name: "Everyday Tote" })).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Generate my campaign" }).click();
  await expect(page.getByLabel("Campaign name")).toHaveValue(
    "A little more Everyday Tote",
  );
  await expect(
    page.getByText("Demo AI output — sample campaign content.", {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Post 2 caption", { exact: true })
    .fill("My carefully edited caption");
  const old = await page
    .getByLabel("Post 1 caption", { exact: true })
    .inputValue();
  await page
    .getByRole("button", { name: "Regenerate post0", exact: true })
    .click();
  await expect(
    page.getByLabel("Post 1 caption", { exact: true }),
  ).not.toHaveValue(old);
  await expect(page.getByLabel("Post 2 caption", { exact: true })).toHaveValue(
    "My carefully edited caption",
  );
  await expect(
    page.getByLabel("Visual 3 prompt", { exact: true }),
  ).toBeVisible();
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page
    .getByRole("button", { name: "Copy campaign", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Copied!", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "My carefully edited caption",
  );
  await page.screenshot({ path: "/tmp/forma-results.png", fullPage: true });
});

test("mobile layout and invalid upload feedback", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Let’s get to know your brand." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "bad.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("not a brand document"),
    });
  await expect(page.locator(".error[role=alert]")).toContainText(
    "PDF, DOCX, or TXT",
  );
  await page.screenshot({ path: "/tmp/forma-mobile.png", fullPage: true });
});

test("API rejects unsupported documents, malformed PDFs, empty text, and invalid campaigns", async ({
  request,
}) => {
  let res = await request.post("/api/brand", {
    multipart: {
      file: {
        name: "bad.exe",
        mimeType: "application/octet-stream",
        buffer: Buffer.from("test"),
      },
    },
  });
  expect(res.status()).toBe(400);
  res = await request.post("/api/brand", {
    multipart: {
      file: {
        name: "fake.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("not actually pdf"),
      },
    },
  });
  expect(res.status()).toBe(422);
  res = await request.post("/api/brand", {
    multipart: {
      file: {
        name: "empty.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("short"),
      },
    },
  });
  expect(res.status()).toBe(400);
  res = await request.post("/api/campaign", {
    data: { brand: {}, product: {} },
  });
  expect(res.status()).toBe(400);
});

test("extracts readable PDF and DOCX brand documents", async ({ request }) => {
  const { readFile } = await import("node:fs/promises");
  for (const [extension, mimeType] of [
    ["pdf", "application/pdf"],
    [
      "docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  ]) {
    const buffer = await readFile(`e2e/fixtures/brand.${extension}`);
    const response = await request.post("/api/brand", {
      multipart: { file: { name: `brand.${extension}`, mimeType, buffer } },
    });
    expect(response.status(), await response.text()).toBe(200);
    const result = await response.json();
    expect(result.demo).toBe(true);
    expect(result.brand.positioning).toBeTruthy();
  }
});
