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
  await page
    .locator("input[type=file]")
    .setInputFiles("e2e/fixtures/product.png");
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
  await expect(
    page.getByRole("img", { name: "Hero campaign visual" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Lifestyle campaign visual" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Creative campaign visual" }),
  ).toBeVisible();
  await expect(
    page.getByText("Demo reference only — not an AI-generated advertisement."),
  ).toHaveCount(3);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Hero image" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("forma-hero.png");
  await page.getByRole("button", { name: "Regenerate Hero image" }).click();
  await expect(
    page.getByRole("button", { name: "Regenerate Hero image" }),
  ).toBeEnabled();
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

test("image API validates reference contents and generation metadata", async ({
  request,
}) => {
  const { demoBrand, demoCampaign } = await import("../lib/mock");
  const brand = demoBrand("Test brand");
  const product = {
    name: "Cup",
    description: "A ceramic cup",
    features: "",
    benefits: "",
    price: "",
  };
  const campaign = demoCampaign(brand, product);
  const response = await request.post("/api/images", {
    multipart: {
      metadata: JSON.stringify({
        brand,
        product,
        visual: campaign.visuals[0],
        ad: campaign.posts[0],
        index: 0,
      }),
      image: {
        name: "fake.png",
        mimeType: "image/png",
        buffer: Buffer.from("not a png"),
      },
    },
  });
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain("decode");
});

async function openFixtureCampaign(
  page: import("@playwright/test").Page,
  navigate = true,
) {
  if (navigate) await page.goto("/");
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "fixture.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "A fixture brand with a calm tone and considered ceramic products.",
      ),
    });
  await page.getByRole("button", { name: "Analyze brand" }).click();
  await page.getByRole("button", { name: "Approve brand & continue" }).click();
  await page.getByLabel("Product name *", { exact: true }).fill("Fixture cup");
  await page
    .getByLabel("Description *", { exact: true })
    .fill("A ceramic espresso cup.");
  await page
    .locator("input[type=file]")
    .setInputFiles("e2e/fixtures/product.png");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Generate my campaign" }).click();
}
test("a successful API response missing image data is visible instead of silently blank", async ({
  page,
}) => {
  await page.route("**/api/images", (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "x-forma-request-id": "fixture-missing",
      },
      body: JSON.stringify({ ok: true }),
    }),
  );
  await openFixtureCampaign(page);
  await expect(page.locator(".image-error")).toHaveCount(3);
  await expect(page.locator(".image-error").first()).toContainText(
    "no valid image data",
  );
  await expect(page.locator(".image-error").first()).toContainText(
    "fixture-missing",
  );
});
test("browser decode failures are visible without triggering another image request", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/images", (route) => {
    requests++;
    return route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "x-forma-request-id": "fixture-corrupt",
      },
      body: JSON.stringify({
        image: {
          dataUrl: "data:image/png;base64,iVBORw0KGgo=",
          demo: false,
          model: "fixture",
        },
      }),
    });
  });
  await openFixtureCampaign(page);
  await expect(
    page.getByText("The browser could not display the returned image.", {
      exact: false,
    }),
  ).toHaveCount(3);
  await expect(page.locator(".image-error").first()).toContainText(
    "fixture-corrupt",
  );
  expect(requests).toBe(3);
});

test("all campaign cards stay visible under legacy advertising cosmetic filters", async ({
  page,
}) => {
  await page.goto("/");
  // Simulate the browser extension stylesheet before campaign content is mounted.
  await page.addStyleTag({
    content:
      '.ad-card, .ad-image, .ad-image-section, .editable-ad-field, [class^="ad-"], [class*=" ad-"] { display: none !important; }',
  });
  // Prove that the simulated rule is active; legacy markup remains in the DOM but is hidden.
  await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "ad-card";
    probe.textContent = "Cosmetic filter probe";
    probe.dataset.filterProbe = "true";
    document.body.append(probe);
  });
  const probe = page.locator("[data-filter-probe]");
  await expect(probe).toHaveCount(1);
  await expect(probe).toBeHidden();
  expect(
    await probe.evaluate((element) => getComputedStyle(element).display),
  ).toBe("none");
  // Stay in this document so the simulated extension stylesheet remains active.
  await openFixtureCampaign(page, false);
  await expect(
    page.getByRole("heading", {
      name: "Three concepts. One unmistakable brand.",
    }),
  ).toBeVisible();
  const cards = page.locator(".campaign-post-card");
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const card = cards.nth(i);
    await expect(card).toBeVisible();
    const computed = await card.evaluate((element) => ({
      display: getComputedStyle(element).display,
      visibility: getComputedStyle(element).visibility,
      width: element.getBoundingClientRect().width,
      height: element.getBoundingClientRect().height,
    }));
    expect(computed.display).not.toBe("none");
    expect(computed.visibility).toBe("visible");
    expect(computed.width).toBeGreaterThan(0);
    expect(computed.height).toBeGreaterThan(0);
    await expect(card.locator(".campaign-visual-preview")).toBeVisible();
    await expect(
      card.getByLabel(`Post ${i + 1} headline`, { exact: true }),
    ).toBeVisible();
    await expect(
      card.getByLabel(`Post ${i + 1} caption`, { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        card
          .locator("img")
          .evaluate(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
      )
      .toBe(true);
  }
  await expect(
    page.locator(
      '.results [class^="ad-"], .results [class*=" ad-"], .results .editable-ad-field',
    ),
  ).toHaveCount(0);
  await expect(probe).toHaveCount(1);
  await expect(probe).toBeHidden();
});
