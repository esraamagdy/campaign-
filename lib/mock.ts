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
    audience: b.audience,
    message: `${p.name}: ${p.benefits || p.description}.`,
    posts: [
      "The everyday upgrade",
      "Details that make a difference",
      "Make it yours",
    ].map((title, i) => ({
      title,
      headline: [
        `Meet ${p.name}`,
        `The details behind ${p.name}`,
        `Make space for ${p.name}`,
      ][i],
      concept: [
        `Introduce ${p.name} in a relatable everyday setting.`,
        `A close-up carousel exploring ${p.features || "the product’s considered details"}.`,
        `Show how ${p.name} fits into your audience’s routine.`,
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
      concept: `${["A product-led still life", "A tactile detail composition", "A lifestyle moment"][i]} inspired by ${b.name}.`,
      prompt: `Editorial e-commerce photograph of ${p.name}. Product description: ${p.description}. ${b.visual}. ${["Minimal hero composition on a plinth", "Macro detail composition with interesting shadows", "Authentic lifestyle setting with the product as the focal point"][i]}. No text, no logos, no invented product details.`,
    })),
  };
}
