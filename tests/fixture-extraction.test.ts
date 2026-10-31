import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { z } from "zod";
import { brandPrompt } from "../lib/prompts";
import { brandExtractionSchema, groundBrand } from "../lib/brand";

test("authored fixture extraction consumes the actual brand prompt for all corpus documents", async () => {
  const originalFetch = globalThis.fetch;
  const previousMockFlag = process.env.FORMA_TEST_MOCK_FAL;
  process.env.FORMA_TEST_MOCK_FAL = "1";
  try {
    await import("./fal-preload.mjs");
    for (const id of ["rich", "sparse", "conflicting"] as const) {
      const source = fs.readFileSync(
        `tests/fixtures/quality/brand-${id}.txt`,
        "utf8",
      );
      const response = await fetch("https://fal.run/openrouter/router", {
        method: "POST",
        body: JSON.stringify({
          prompt: brandPrompt(source),
          system_prompt:
            "JSON_SCHEMA:\n" +
            JSON.stringify(z.toJSONSchema(brandExtractionSchema)),
        }),
      });
      const envelope = await response.json();
      const result = groundBrand(
        brandExtractionSchema.parse(JSON.parse(envelope.output)),
        source,
      );
      assert.equal(
        result.brand.name,
        { rich: "Cinder", sparse: "Pebble", conflicting: "Morrow" }[id],
      );
      if (id === "rich") {
        // Cinder fallback would also match the name, so assert corpus-only facts.
        assert.equal(result.brand.audience, "home espresso enthusiasts");
        assert.equal(result.brand.colors, "navy #123456 and cream #FFF8E7");
      } else if (id === "sparse") {
        assert.equal(result.brand.tone, "friendly and direct");
        assert.equal(result.brand.audience, "Not specified in document");
      } else {
        assert.equal(result.brand.tone, "Not specified in document");
        assert.equal(result.brand.colors, "forest green #114433");
        assert.equal(result.brand.messages, "Not specified in document");
      }
      assert.equal(result.review.name.status, "needs-review");
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previousMockFlag === undefined) delete process.env.FORMA_TEST_MOCK_FAL;
    else process.env.FORMA_TEST_MOCK_FAL = previousMockFlag;
  }
});
