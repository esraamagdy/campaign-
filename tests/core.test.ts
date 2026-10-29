import { test } from "node:test";
import assert from "node:assert/strict";
import { brandSchema, requestSchema, campaignSchema } from "../lib/schemas";
import { demoBrand, demoCampaign } from "../lib/mock";
import { mergeCampaign } from "../lib/campaign";
import { readBody } from "../lib/http";
const brand = demoBrand("A thoughtful brand document with meaningful context.");
const product = {
  name: "Everyday Tote",
  description: "A cotton bag for daily essentials",
  features: "Inside pocket",
  benefits: "Keep your essentials organized",
  price: "$48",
};
test("demo campaign contains exactly three complete social and visual concepts", () => {
  const campaign = campaignSchema.parse(demoCampaign(brand, product));
  assert.equal(campaign.posts.length, 3);
  assert.equal(campaign.visuals.length, 3);
  assert.match(campaign.message, /Everyday Tote/);
  assert.equal(campaign.audience, brand.audience);
});
test("input validation rejects blank required values, invalid targets, and oversized fields", () => {
  assert.equal(brandSchema.safeParse({ ...brand, name: "   " }).success, false);
  assert.equal(
    requestSchema.safeParse({ brand, product: { ...product, name: "" } })
      .success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({ brand, product, element: "post9" }).success,
    false,
  );
  assert.equal(
    requestSchema.safeParse({
      brand,
      product: { ...product, description: "a".repeat(4001) },
    }).success,
    false,
  );
});
test("individual regeneration preserves all other user edits and does not mutate input", () => {
  const current = demoCampaign(brand, product);
  current.posts[1].caption = "My carefully edited caption";
  const fresh = demoCampaign(brand, { ...product, name: "New product" });
  const merged = mergeCampaign(current, fresh, "post0");
  assert.deepEqual(merged.posts[0], fresh.posts[0]);
  assert.deepEqual(merged.posts[1], current.posts[1]);
  assert.deepEqual(merged.visuals, current.visuals);
  assert.equal(merged.name, current.name);
  assert.notDeepEqual(current.posts[0], fresh.posts[0]);
  assert.equal(mergeCampaign(current, fresh, "name").name, fresh.name);
});
test("streamed body limit rejects oversized requests without Content-Length", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: "a".repeat(20),
  });
  await assert.rejects(readBody(req, 10), /size limit/);
  const bytes = await readBody(
    new Request("http://localhost", { method: "POST", body: "hello" }),
    10,
  );
  assert.equal(new TextDecoder().decode(bytes), "hello");
});
