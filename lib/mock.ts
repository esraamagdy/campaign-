import { Brand, Product, Campaign } from "./schemas";
export function demoBrand(text: string): Brand {
  return {
    name: "Your brand",
    personality:
      "Thoughtful, approachable, quietly confident (demo suggestion).",
    colors: "Sage and cream (demo suggestion; review against your document).",
    positioning:
      "Thoughtful everyday essentials that make small moments feel exceptional.",
    audience:
      "Intentional shoppers who value quality, simplicity, and considered design.",
    tone: "Warm, confident, conversational. Keep language clear and inviting.",
    values: "Quality, intentionality, transparency, everyday delight.",
    messages:
      "Make room for the things that matter. Better essentials, thoughtfully made.",
    visual:
      "Soft natural light, warm neutrals, generous whitespace, tactile close-ups." +
      (text
        ? " Review these illustrative suggestions against your uploaded document."
        : ""),
  };
}
export function demoCampaign(b: Brand, p: Product): Campaign {
  return {
    name: `A little more ${p.name}`,
    idea: `Turn an everyday moment into a ritual worth looking forward to with ${p.name}.`,
    objective: `Introduce ${p.name}, build consideration, and invite shoppers to discover the product.`,
    audience:
      b.audience === "Not specified in document"
        ? "Proposed direction: shoppers exploring this product category."
        : b.audience,
    message: `${p.name}: ${p.benefits || p.description}.`,
    posts: [
      "Hero: the product details",
      "Lifestyle: an everyday use case",
      "Creative: a fresh perspective",
    ].map((title, i) => ({
      title,
      headline: [
        `Meet ${p.name}`,
        `The details behind ${p.name}`,
        `Make space for ${p.name}`,
      ][i],
      concept: [
        `A product-led close-up of ${p.name}: ${p.features || p.description}.`,
        `Proposed direction: show ${p.name} in an everyday use case, keeping its real details visible.`,
        `Proposed direction: frame ${p.name} with unexpected shadows as a visual metaphor; preserve the product.`,
      ][i],
      caption: `${["Small moments. A fresh perspective.", "It’s the little details that make it personal.", "Your next favorite ritual starts here."][i]} Discover ${p.name}.`,
      cta: [
        "Explore the collection",
        "Discover the details",
        "Find your everyday favorite",
      ][i],
    })),
    visuals: ["Hero", "Lifestyle", "Creative"].map((title, i) => ({
      title,
      concept: `${["A product-led close-up", "An everyday use case", "An unexpected shadow metaphor"][i]} inspired by ${b.name}.`,
      prompt: `Proposed art direction: editorial e-commerce photograph of ${p.name}. Product description: ${p.description}. ${b.visual === "Not specified in document" ? "No supplied visual brand guidelines." : b.visual}. ${["Minimal hero close-up showing the product details", "Everyday lifestyle setting with the product as the focal point", "Unexpected cast shadows as a visual metaphor around the unchanged product"][i]}. Preserve the reference product, its existing logos and label text. No added text or invented product details.`,
    })),
  };
}
