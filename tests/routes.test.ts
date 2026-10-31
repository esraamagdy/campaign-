import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { POST as brandPOST } from "../app/api/brand/route";
import { POST as campaignPOST } from "../app/api/campaign/route";
import { POST as imagesPOST } from "../app/api/images/route";
import { GET as statusGET } from "../app/api/status/route";
process.env.FAL_KEY = "forma-integration-test-placeholder";
process.env.AI_MODE = "live";
process.env.FORMA_TEST_MOCK_FAL = "1";
process.env.AI_IMAGES_PER_HOUR = "2";
process.env.AI_TEXT_REQUESTS_PER_HOUR = "20";
const jsonRequest = (path: string, data: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
const doc =
  "Cinder makes handmade ceramic cups. Our personality is warm and practical. Our tone is clear and calm.";
const product = {
  name: "Cinder Cup",
  description: "A handmade ceramic espresso cup",
  features: "Matte glaze",
  benefits: "A comfortable grip",
  price: "",
};
async function brandRequest() {
  const form = new FormData();
  form.set("file", new File([doc], "brand.txt", { type: "text/plain" }));
  return brandPOST(
    new Request("http://localhost/api/brand", { method: "POST", body: form }),
  );
}
test("current FAL-backed routes: document grounding, unique strategy, image reference, partial regeneration and failure budget", async () => {
  await import("./fal-preload.mjs");
  let response: Response = await brandRequest();
  assert.equal(response.status, 200);
  const analysis = await response.json();
  assert.equal(analysis.demo, false);
  assert.equal(analysis.brand.name, "Cinder");
  assert.equal(analysis.brand.colors, "Not specified in document");
  assert.equal(analysis.evidence.name, "Cinder makes handmade ceramic cups.");
  response = await campaignPOST(
    jsonRequest("/api/campaign", { brand: analysis.brand, product }),
  );
  assert.equal(response.status, 200);
  const { campaign } = await response.json();
  assert.equal(
    new Set(campaign.posts.map((p: { headline: string }) => p.headline)).size,
    3,
  );
  const png = await readFile("e2e/fixtures/product.png");
  const imageRequest = async (fail = false) => {
    const form = new FormData();
    form.set(
      "image",
      new File([new Uint8Array(png)], "product.png", { type: "image/png" }),
    );
    form.set(
      "metadata",
      JSON.stringify({
        brand: analysis.brand,
        product,
        index: 0,
        ad: campaign.posts[0],
        visual: {
          ...campaign.visuals[0],
          ...(fail ? { prompt: "__MOCK_IMAGE_FAIL__" } : {}),
        },
      }),
    );
    return imagesPOST(
      new Request("http://localhost/api/images", {
        method: "POST",
        body: form,
      }),
    );
  };
  response = await imageRequest();
  assert.equal(response.status, 200);
  const { image } = await response.json();
  assert.equal(image.demo, false);
  assert.equal(image.model, "fal-ai/flux-pro/kontext");
  assert.equal(
    image.dataUrl,
    `data:image/png;base64,${png.toString("base64")}`,
  );
  response = await campaignPOST(
    jsonRequest("/api/campaign", {
      brand: analysis.brand,
      product,
      current: campaign,
      element: "post0.headline",
    }),
  );
  assert.equal(response.status, 200);
  const { campaign: updated } = await response.json();
  assert.notEqual(updated.posts[0].headline, campaign.posts[0].headline);
  assert.equal(updated.posts[0].caption, campaign.posts[0].caption);
  assert.deepEqual(updated.posts[1], campaign.posts[1]);
  assert.deepEqual(updated.visuals, campaign.visuals);
  response = await imageRequest(true);
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /FAL usage or billing/);
  response = await imageRequest();
  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /limit reached/);
  const status = await statusGET().json();
  assert.equal(status.imagesRemaining, 0);
  assert.equal(status.textModel, "google/gemini-2.5-flash");
  assert.ok(
    !JSON.stringify(status).includes("forma-integration-test-placeholder"),
  );
});
test("demo routes never call a provider even with a key configured", async () => {
  process.env.AI_MODE = "demo";
  globalThis.fetch = async () => {
    throw new Error("Unexpected network in demo mode");
  };
  let response: Response = await brandRequest();
  assert.equal(response.status, 200);
  const { brand, demo } = await response.json();
  assert.equal(demo, true);
  response = await campaignPOST(
    jsonRequest("/api/campaign", { brand, product }),
  );
  assert.equal(response.status, 200);
  const { campaign } = await response.json();
  const form = new FormData();
  form.set(
    "metadata",
    JSON.stringify({
      brand,
      product,
      index: 0,
      ad: campaign.posts[0],
      visual: campaign.visuals[0],
    }),
  );
  form.set(
    "image",
    new File(
      [new Uint8Array(await readFile("e2e/fixtures/product.png"))],
      "product.png",
      { type: "image/png" },
    ),
  );
  response = await imagesPOST(
    new Request("http://localhost/api/images", { method: "POST", body: form }),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).image.demo, true);
});

test("partial regeneration enforces field limits and merged semantics without changing unrelated edits", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "forma-integration-test-placeholder";
  process.env.AI_TEXT_REQUESTS_PER_HOUR = "100";
  const { demoBrand, demoCampaign } = await import("../lib/mock");
  const brand = demoBrand(doc);
  const current = demoCampaign(brand, product);
  current.posts[2].caption = "  A carefully preserved customer edit.  ";
  const saved = structuredClone(current);
  let output: unknown;
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ output: JSON.stringify(output) });
  try {
    for (const [element, value] of [
      ["post0.headline", { value: "x".repeat(501) }],
      ["post0.headline", { value: "   " }],
      ["post0.headline", { value: current.posts[1].headline }],
      ["post0.caption", { value: current.posts[1].caption }],
      ["post0.cta", { value: current.posts[1].cta }],
      ["visual0", { title: "Hero", concept: "Scene", prompt: "  " }],
      ["post0", { ...current.posts[0], caption: "" }],
      ["name", { value: "  " }],
    ] as const) {
      output = value;
      const response = await campaignPOST(
        jsonRequest("/api/campaign", { brand, product, current, element }),
      );
      assert.equal(response.status, 502, `Reject invalid ${element}`);
      assert.deepEqual(current, saved);
    }
    output = { value: "A fresh ceramic story" };
    const response = await campaignPOST(
      jsonRequest("/api/campaign", {
        brand,
        product,
        current,
        element: "post0.headline",
      }),
    );
    assert.equal(response.status, 200);
    const { campaign } = await response.json();
    const expected = structuredClone(saved);
    expected.posts[0].headline = "A fresh ceramic story";
    assert.deepEqual(campaign, expected);
    const cleared = structuredClone(current);
    cleared.posts[0].headline = "";
    let repaired = await campaignPOST(
      jsonRequest("/api/campaign", {
        brand,
        product,
        current: cleared,
        element: "post0.headline",
      }),
    );
    assert.equal(repaired.status, 200, "A cleared target can be repaired");
    assert.deepEqual((await repaired.json()).campaign, expected);
    assert.equal(cleared.posts[0].headline, "", "Input draft is not mutated");
    cleared.posts[1].caption = "";
    repaired = await campaignPOST(
      jsonRequest("/api/campaign", {
        brand,
        product,
        current: cleared,
        element: "post0.headline",
      }),
    );
    assert.equal(
      repaired.status,
      502,
      "An unrelated invalid draft is not returned as a valid campaign",
    );
    assert.equal(cleared.posts[1].caption, "");
  } finally {
    globalThis.fetch = previousFetch;
  }
});
