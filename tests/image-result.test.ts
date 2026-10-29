import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  decodeFalImage,
  ImageResultError,
} from "../lib/providers/image-result";
import { falImage } from "../lib/providers/fal";
import { readImageResponse } from "../lib/image-client";
const fetchOriginal = globalThis.fetch;
const infoOriginal = console.info;
const errorOriginal = console.error;
const key = process.env.FAL_KEY;
const mode = process.env.AI_MODE;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
  console.info = infoOriginal;
  console.error = errorOriginal;
  if (key === undefined) delete process.env.FAL_KEY;
  else process.env.FAL_KEY = key;
  if (mode === undefined) delete process.env.AI_MODE;
  else process.env.AI_MODE = mode;
});
const fixture = () =>
  sharp({ create: { width: 8, height: 8, channels: 3, background: "#aabbcc" } })
    .png()
    .toBuffer();
const result = (url: string) => ({
  images: [{ url, content_type: "image/png", width: 8, height: 8 }],
  has_nsfw_concepts: [false],
  seed: 123,
  timings: { inference: 1.2 },
});
test("regression: valid inline PNG with generic FAL MIME label was rejected by the old literal prefix check", async () => {
  const png = await fixture();
  const url = `data:application/octet-stream;base64,${png.toString("base64")}`;
  assert.equal(url.startsWith("data:image/png;base64,"), false);
  assert.equal(
    await decodeFalImage(result(url)),
    `data:image/png;base64,${png.toString("base64")}`,
  );
});
test("inline MIME parameters, unspecified MIME, whitespace and unpadded base64 normalize correctly", async () => {
  const png = await fixture();
  const b64 = png.toString("base64");
  for (const url of [
    `data:image/png;charset=utf-8;base64,${b64}`,
    `data:;base64,${b64.replace(/=+$/, "")}`,
    `data:image/png;base64,\n${b64}\n`,
  ])
    assert.equal(
      await decodeFalImage(result(url)),
      `data:image/png;base64,${b64}`,
    );
});
test("JPEG and WebP inline bytes normalize to actual decodable PNG regardless of metadata label", async () => {
  const png = await fixture();
  for (const format of ["jpeg", "webp"] as const) {
    const buffer = await sharp(png)[format]().toBuffer();
    const normalized = await decodeFalImage(
      result(`data:image/${format};base64,${buffer.toString("base64")}`),
    );
    const decoded = Buffer.from(normalized.split(",")[1], "base64");
    const meta = await sharp(decoded).metadata();
    assert.equal(meta.format, "png");
    assert.equal(meta.width, 8);
  }
});
test("SDK data envelope and hosted FAL media bytes share the same decoder", async () => {
  const png = await fixture();
  const inline = result(`data:image/png;base64,${png.toString("base64")}`);
  assert.match(
    await decodeFalImage({ data: inline, requestId: "provider-id" }),
    /^data:image\/png;base64,/,
  );
  globalThis.fetch = async (input, init) => {
    assert.equal(
      String(input),
      "https://v3.fal.media/files/image.png?token=private-token",
    );
    assert.equal(init?.headers, undefined);
    assert.equal(init?.redirect, "error");
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "application/octet-stream" },
    });
  };
  assert.equal(
    await decodeFalImage(
      result("https://v3.fal.media/files/image.png?token=private-token"),
    ),
    inline.images[0].url,
  );
});
test("corrupt raster with a valid PNG signature does not reach the browser", async () => {
  const fake = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  await assert.rejects(
    decodeFalImage(result(`data:image/png;base64,${fake.toString("base64")}`)),
    (error: unknown) =>
      error instanceof ImageResultError && error.code === "decode_failed",
  );
});
test("missing image, invalid base64, non-raster files and unsafe URLs have safe diagnostic codes", async () => {
  for (const [response, code] of [
    [{ images: [] }, "missing_image"],
    [result("data:image/png;base64,%%%"), "invalid_base64"],
    [
      result(
        "data:application/octet-stream;base64," +
          Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
          ).toString("base64"),
      ),
      "unsupported_format",
    ],
    [result("https://127.0.0.1/private?key=secret"), "untrusted_url"],
  ] as const)
    await assert.rejects(
      decodeFalImage(response),
      (error: unknown) =>
        error instanceof ImageResultError && error.code === code,
    );
});
test("hosted download errors distinguish completed inference from failed media delivery", async () => {
  globalThis.fetch = async () => new Response("", { status: 403 });
  await assert.rejects(
    decodeFalImage(result("https://v3.fal.media/files/image.png")),
    (error: unknown) =>
      error instanceof ImageResultError &&
      error.code === "download_failed" &&
      error.message.includes("HTTP 403"),
  );
});
test("diagnostics include correlation and format metadata but no key, prompt, URL or base64", async () => {
  const png = await fixture();
  const records: unknown[][] = [];
  console.info = (...args) => {
    records.push(args);
  };
  console.error = (...args) => {
    records.push(args);
  };
  process.env.FAL_KEY = "private-fal-key";
  process.env.AI_MODE = "live";
  globalThis.fetch = async () =>
    Response.json(
      result(`data:application/octet-stream;base64,${png.toString("base64")}`),
      { headers: { "x-fal-request-id": "provider-123" } },
    );
  await falImage.edit(
    new File([new Uint8Array(png)], "private-product.png", {
      type: "image/png",
    }),
    "private campaign prompt",
    { requestId: "request-123", index: 0 },
  );
  const logs = JSON.stringify(records);
  assert.match(logs, /request-123/);
  assert.match(logs, /provider-123/);
  assert.match(logs, /decoded/);
  for (const value of [
    "private-fal-key",
    "private campaign prompt",
    "private-product.png",
    png.toString("base64"),
    "data:application",
    "https://",
  ])
    assert.ok(!logs.includes(value));
});
test("frontend rejects silent malformed 200 responses and preserves request references on failures", async () => {
  await assert.rejects(
    readImageResponse(
      Response.json(
        { success: true },
        { headers: { "x-forma-request-id": "request-123" } },
      ),
    ),
    /no valid image data.*request-123/,
  );
  await assert.rejects(
    readImageResponse(
      new Response("<html>gateway</html>", {
        status: 502,
        headers: { "x-forma-request-id": "request-123" },
      }),
    ),
    /unreadable response.*502.*request-123/,
  );
  await assert.rejects(
    readImageResponse(
      Response.json(
        { error: "Media download failed" },
        { status: 502, headers: { "x-forma-request-id": "request-123" } },
      ),
    ),
    /Media download failed.*request-123/,
  );
  const png = await fixture();
  assert.equal(
    (
      await readImageResponse(
        Response.json(
          {
            image: {
              dataUrl: `data:image/png;base64,${png.toString("base64")}`,
              demo: false,
              model: "fal-ai/flux-pro/kontext",
            },
          },
          { headers: { "x-forma-request-id": "request-123" } },
        ),
      )
    ).requestId,
    "request-123",
  );
});

test("image route propagates request IDs and visible decode errors without leaking provider output", async () => {
  const { POST } = await import("../app/api/images/route");
  const { demoBrand, demoCampaign } = await import("../lib/mock");
  const brand = demoBrand("fixture");
  const product = {
    name: "Cup",
    description: "A test cup",
    features: "",
    benefits: "",
    price: "",
  };
  const campaign = demoCampaign(brand, product);
  const png = await fixture();
  process.env.AI_MODE = "live";
  process.env.FAL_KEY = "private-fal-key";
  const logs: unknown[][] = [];
  console.info = (...args) => {
    logs.push(args);
  };
  console.error = (...args) => {
    logs.push(args);
  };
  const request = () => {
    const form = new FormData();
    form.set(
      "image",
      new File([new Uint8Array(png)], "fixture.png", { type: "image/png" }),
    );
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
    return new Request("http://localhost/api/images", {
      method: "POST",
      body: form,
    });
  };
  globalThis.fetch = async () =>
    Response.json(
      result(`data:application/octet-stream;base64,${png.toString("base64")}`),
    );
  let response = await POST(request());
  assert.equal(response.status, 200);
  const id = response.headers.get("x-forma-request-id");
  assert.ok(id);
  assert.equal((await readImageResponse(response)).requestId, id);
  globalThis.fetch = async () =>
    Response.json(result("data:image/png;base64,iVBORw0KGgo="));
  response = await POST(request());
  assert.equal(response.status, 502);
  await assert.rejects(
    readImageResponse(response),
    /could not be decoded.*Reference:/,
  );
  assert.match(JSON.stringify(logs), /decode_failed/);
  assert.ok(!JSON.stringify(logs).includes("private-fal-key"));
  assert.ok(!JSON.stringify(logs).includes(png.toString("base64")));
});
