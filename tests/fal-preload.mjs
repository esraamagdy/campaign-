// Test-only network interception. Never imported by the application.
if (process.env.FORMA_TEST_MOCK_FAL !== "1")
  throw new Error("This preload is only for isolated integration tests.");
import fs from "node:fs";
import sharp from "sharp";
const original = globalThis.fetch;
const png = fs
  .readFileSync(`${process.cwd()}/e2e/fixtures/product.png`)
  .toString("base64");
const jpeg = (
  await sharp(Buffer.from(png, "base64")).jpeg().toBuffer()
).toString("base64");
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url === "https://v3.fal.media/files/forma-fixture.png")
    return new Response(new Uint8Array(Buffer.from(png, "base64")), {
      headers: { "Content-Type": "application/octet-stream" },
    });
  if (!url.startsWith("https://fal.run/")) {
    if (
      url.startsWith("http://127.0.0.1:") ||
      url.startsWith("http://localhost:")
    )
      return original(input, init);
    throw new Error("External network is forbidden in mocked FAL tests.");
  }
  const body = JSON.parse(init.body);
  if (url.includes("/fal-ai/flux-pro/kontext")) {
    if (String(body.prompt).includes("__MOCK_IMAGE_FAIL__"))
      return Response.json(
        { error: { message: "private provider details" } },
        { status: 429 },
      );
    if (
      !body.image_url?.startsWith("data:image/png;base64,") ||
      body.num_images !== 1 ||
      body.sync_mode !== true
    )
      return new Response("", { status: 400 });
    return Response.json({
      images: [
        {
          url: body.prompt.startsWith("Create a Lifestyle")
            ? `data:image/jpeg;base64,${jpeg}`
            : body.prompt.startsWith("Create a Creative")
              ? "https://v3.fal.media/files/forma-fixture.png"
              : `data:application/octet-stream;base64,${png}`,
          content_type: "image/png",
          width: 200,
          height: 200,
        },
      ],
      has_nsfw_concepts: [false],
    });
  }
  if (!url.endsWith("/openrouter/router"))
    throw new Error("Unexpected FAL test endpoint");
  const props = JSON.parse(
    body.system_prompt.split("JSON_SCHEMA:\n")[1],
  ).properties;
  let result;
  if (props.personality) {
    result = {
      name: "Cinder",
      personality: "Warm and practical",
      positioning: "Handmade ceramic cups",
      audience: "Not specified in document",
      tone: "Clear and calm",
      values: "Not specified in document",
      messages: "Not specified in document",
      colors: "Not specified in document",
      visual: "Not specified in document",
    };
    const quotes = {
      name: "Cinder makes handmade ceramic cups.",
      positioning: "Cinder makes handmade ceramic cups.",
      personality: "Our personality is warm and practical.",
      tone: "Our tone is clear and calm.",
    };
    result = Object.fromEntries(
      Object.entries(result).map(([key, value]) => [
        key,
        { value, quote: quotes[key] || "" },
      ]),
    );
  } else if (props.value) {
    result = { value: "A freshly written, specific ceramic-cup headline" };
  } else if (props.posts) {
    result = {
      name: "A place for your pause",
      idea: "Make the espresso pause a small daily ritual.",
      objective: "Introduce the Cinder Cup through material, use and form.",
      audience: "Proposed audience: people who enjoy espresso rituals.",
      message: "A handmade cup for a considered coffee moment.",
      posts: ["Hero", "Lifestyle", "Creative"].map((title, i) => ({
        title,
        concept: [
          "A matte-glaze product study",
          "An espresso moment at a small kitchen table",
          "A sculptural shadow as a creative metaphor",
        ][i],
        headline: [
          "Form meets your first espresso",
          "A pause at your kitchen table",
          "A small cup. A striking shadow.",
        ][i],
        caption: [
          "Meet the matte ceramic Cinder Cup.",
          "Set a place for a slower coffee moment.",
          "Explore the interplay of ceramic form and light.",
        ][i],
        cta: ["View the cup", "Explore the ritual", "See the design"][i],
      })),
      visuals: ["Hero", "Lifestyle", "Creative"].map((title) => ({
        title,
        concept: `${title} composition`,
        prompt: `${title} photograph of the reference Cinder Cup; preserve all product details.`,
      })),
    };
  } else if (props.headline) {
    result = {
      title: "Fresh hero",
      concept: "A glaze detail",
      headline: "See the glaze up close",
      caption: "A closer look at the matte ceramic cup.",
      cta: "Explore the glaze",
    };
  } else
    result = {
      title: "New direction",
      concept: "A new composition",
      prompt: "New lighting for the reference ceramic cup.",
    };
  return Response.json({ output: JSON.stringify(result) });
};
