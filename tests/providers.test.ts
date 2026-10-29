import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import sharp from "sharp";
import { falText, falImage, ProviderError } from "../lib/providers/fal";
import { aiConfig } from "../lib/providers/config";
import { reserveUsage, usageSnapshot } from "../lib/usage";
import { validateReference } from "../lib/uploads";
import { brandPrompt, strategyPrompt, imagePrompt } from "../lib/prompts";
import { demoBrand, demoCampaign } from "../lib/mock";
import { mergeCampaign } from "../lib/campaign";
const originalFetch = globalThis.fetch;
const keys = [
  "FAL_KEY",
  "AI_MODE",
  "AI_TEXT_REQUESTS_PER_HOUR",
  "AI_IMAGES_PER_HOUR",
  "FAL_IMAGE_MODEL",
  "FAL_TEXT_MODEL",
];
const original = new Map(keys.map((k) => [k, process.env[k]]));
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const k of keys) {
    if (original.get(k) === undefined) delete process.env[k];
    else process.env[k] = original.get(k);
  }
  delete (globalThis as typeof globalThis & { formaUsage?: unknown })
    .formaUsage;
});
const brand = demoBrand("Real document facts.");
const product = {
  name: "Cinder Cup",
  description: "A ceramic espresso cup",
  features: "Matte glaze",
  benefits: "A comfortable grip",
  price: "",
};
test("text provider sends actual context, server authorization and schema-guided FAL router input", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "test-placeholder";
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://fal.run/openrouter/router");
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Key test-placeholder",
    );
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, "google/gemini-2.5-flash");
    assert.equal(body.enable_web_search, false);
    assert.equal(body.max_tokens, 6000);
    assert.match(body.system_prompt, /JSON_SCHEMA:/);
    assert.match(body.prompt, /Cinder is a ceramic studio/);
    assert.match(body.prompt, /Not specified in document/);
    return Response.json({
      output: JSON.stringify({
        name: "Cinder",
        color: "Not specified in document",
      }),
    });
  };
  assert.deepEqual(
    await falText.generate(
      brandPrompt("Cinder is a ceramic studio."),
      z.object({ name: z.string(), color: z.string() }),
    ),
    { name: "Cinder", color: "Not specified in document" },
  );
});
test("reference image edit sends original bytes, one output and reference-preservation parameters", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "test-placeholder";
  process.env.FAL_IMAGE_MODEL = "fal-ai/flux-pro/kontext";
  const png = await sharp({
    create: { width: 8, height: 8, channels: 3, background: "#aabbcc" },
  })
    .png()
    .toBuffer();
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://fal.run/fal-ai/flux-pro/kontext");
    const body = JSON.parse(String(init?.body));
    assert.equal(
      (init?.headers as Record<string, string>).Authorization,
      "Key test-placeholder",
    );
    assert.equal(body.num_images, 1);
    assert.equal(body.aspect_ratio, "1:1");
    assert.equal(body.sync_mode, true);
    assert.equal(body.output_format, "png");
    assert.equal(body.enhance_prompt, false);
    assert.deepEqual(Buffer.from(body.image_url.split(",")[1], "base64"), png);
    assert.match(body.prompt, /Preserve product geometry/);
    return Response.json({
      images: [{ url: `data:image/png;base64,${png.toString("base64")}` }],
      has_nsfw_concepts: [false],
    });
  };
  const campaign = demoCampaign(brand, product);
  const result = await falImage.edit(
    new File([new Uint8Array(png)], "product.png", { type: "image/png" }),
    imagePrompt(brand, product, campaign.visuals[0], 0, campaign.posts[0]),
  );
  assert.match(result.dataUrl, /^data:image\/png;base64,/);
});
test("provider failures are useful and do not leak the server key or provider body", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "test-placeholder";
  globalThis.fetch = async () =>
    new Response("sensitive provider internals", { status: 429 });
  await assert.rejects(
    falText.generate("test", z.object({ x: z.string() })),
    (error: unknown) =>
      error instanceof ProviderError &&
      error.status === 429 &&
      !error.message.includes("sensitive") &&
      !error.message.includes("test-placeholder"),
  );
  globalThis.fetch = async () => Response.json({ output: '{"wrong":1}' });
  await assert.rejects(
    falText.generate("test", z.object({ x: z.string() })),
    /structured JSON/,
  );
});
test("budget counts paid attempts, rejects excess concurrency, resets hourly and supports zero", () => {
  process.env.AI_IMAGES_PER_HOUR = "3";
  const a = reserveUsage("image", 1000),
    b = reserveUsage("image", 1000);
  assert.throws(() => reserveUsage("image", 1000), /running/);
  a();
  a();
  b();
  const c = reserveUsage("image", 1000);
  c();
  assert.throws(() => reserveUsage("image", 1000), /limit reached/);
  assert.equal(usageSnapshot(3601000).state.image, 0);
  const release = reserveUsage("image", 3601000);
  release();
  process.env.AI_TEXT_REQUESTS_PER_HOUR = "0";
  assert.throws(() => reserveUsage("text", 3601000), /limit reached/);
});
test("live mode fails closed without a key and demo can be forced with a key present", () => {
  process.env.AI_MODE = "live";
  delete process.env.FAL_KEY;
  assert.throws(aiConfig, /missing/);
  process.env.FAL_KEY = "test-placeholder";
  process.env.AI_MODE = "demo";
  assert.equal(aiConfig().demo, true);
});
test("image validation rejects a forged MIME file and oversized payload before generation", async () => {
  await assert.rejects(
    validateReference(
      new File(["not an image"], "fake.png", { type: "image/png" }),
    ),
    /decode/,
  );
  await assert.rejects(
    validateReference(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", {
        type: "image/png",
      }),
    ),
    /5 MB/,
  );
});
test("single caption regeneration preserves its headline and every other element", () => {
  const current = demoCampaign(brand, product);
  const fresh = structuredClone(current);
  fresh.posts[0].caption = "New caption";
  fresh.posts[0].headline = "Must not overwrite";
  const merged = mergeCampaign(current, fresh, "post0.caption");
  assert.equal(merged.posts[0].caption, "New caption");
  assert.equal(merged.posts[0].headline, current.posts[0].headline);
  assert.deepEqual(merged.posts[1], current.posts[1]);
  assert.deepEqual(merged.visuals, current.visuals);
});
test("strategy context requests distinct angles and binds each image to its paired advertisement", () => {
  const prompt = strategyPrompt(brand, product);
  assert.match(prompt, /Hero/);
  assert.match(prompt, /Lifestyle/);
  assert.match(prompt, /Creative/);
  assert.match(prompt, /Matte glaze/);
  const campaign = demoCampaign(brand, product);
  assert.match(
    imagePrompt(brand, product, campaign.visuals[1], 1, campaign.posts[1]),
    new RegExp(campaign.posts[1].headline),
  );
});

test("strategy validation rejects empty and repeated ad copy", async () => {
  const { validateStrategy } = await import("../lib/campaign");
  const campaign = demoCampaign(brand, product);
  assert.doesNotThrow(() => validateStrategy(campaign));
  campaign.posts[1].headline = campaign.posts[0].headline.toUpperCase() + "!";
  assert.throws(() => validateStrategy(campaign), /repeated/);
  campaign.posts[1].headline = "Different headline";
  campaign.posts[2].caption = " ";
  assert.throws(() => validateStrategy(campaign), /empty/);
});

test("brand grounding discards unsupported fields, missing facts, and invented color codes", async () => {
  const { groundBrand } = await import("../lib/brand");
  const source =
    "Cinder makes ceramic cups. Our tone is calm. Our palette uses sage green.";
  const fields = Object.fromEntries(
    Object.keys(brand).map((key) => [
      key,
      { value: "Invented value", quote: "Not in this document at all." },
    ]),
  ) as Parameters<typeof groundBrand>[0];
  fields.name = { value: "Cinder", quote: "Cinder makes ceramic cups." };
  fields.tone = { value: "Calm", quote: "Our tone is calm." };
  fields.colors = {
    value: "Sage green #00ff00",
    quote: "Our palette uses sage green.",
  };
  const result = groundBrand(fields, source);
  assert.equal(result.brand.name, "Cinder");
  assert.equal(result.brand.tone, "Calm");
  assert.equal(result.brand.audience, "Not specified in document");
  assert.equal(result.brand.colors, "Not specified in document");
  assert.equal(result.evidence.colors, "");
});

test("router accepts one fenced JSON block but rejects partial output and prose", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "test-placeholder";
  const schema = z.object({ x: z.string() });
  globalThis.fetch = async () =>
    Response.json({ output: '```json\n{"x":"ok"}\n```' });
  assert.deepEqual(await falText.generate("test", schema), { x: "ok" });
  globalThis.fetch = async () =>
    Response.json({ output: '{"x":"ok"}', partial: true });
  await assert.rejects(falText.generate("test", schema), /incomplete/);
  globalThis.fetch = async () =>
    Response.json({ output: 'Here is your JSON: {"x":"ok"}' });
  await assert.rejects(falText.generate("test", schema), /structured JSON/);
});
test("FAL image download allows only trusted storage and never forwards the key", async () => {
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "test-placeholder";
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#ffffff" },
  })
    .png()
    .toBuffer();
  const file = new File([new Uint8Array(png)], "product.png", {
    type: "image/png",
  });
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    if (calls === 1)
      return Response.json({
        images: [{ url: "https://v3.fal.media/files/result.png" }],
      });
    assert.equal(String(input), "https://v3.fal.media/files/result.png");
    assert.equal(init?.headers, undefined);
    assert.equal(init?.redirect, "error");
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png" },
    });
  };
  assert.equal(
    (await falImage.edit(file, "prompt")).dataUrl,
    `data:image/png;base64,${png.toString("base64")}`,
  );
  assert.equal(calls, 2);
  calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json({ images: [{ url: "https://127.0.0.1/private" }] });
  };
  await assert.rejects(falImage.edit(file, "prompt"), /untrusted/);
  assert.equal(calls, 1);
});
