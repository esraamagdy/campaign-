import "server-only";
export function aiConfig() {
  const mode = process.env.AI_MODE || "auto";
  if (!["auto", "demo", "live"].includes(mode))
    throw new Error("AI_MODE must be auto, demo, or live.");
  const demo = mode === "demo" || (mode === "auto" && !process.env.FAL_KEY);
  if (!demo && !process.env.FAL_KEY)
    throw new Error(
      "Live AI is enabled but FAL_KEY is missing. Configure the server key or choose AI_MODE=demo.",
    );
  const imageModel = process.env.FAL_IMAGE_MODEL || "fal-ai/flux-pro/kontext";
  if (
    !["fal-ai/flux-pro/kontext", "fal-ai/flux-pro/kontext/max"].includes(
      imageModel,
    )
  )
    throw new Error(
      "FAL_IMAGE_MODEL must be fal-ai/flux-pro/kontext or fal-ai/flux-pro/kontext/max.",
    );
  return {
    demo,
    textModel: process.env.FAL_TEXT_MODEL || "google/gemini-2.5-flash",
    imageModel,
    imageQuality: "standard",
  };
}
