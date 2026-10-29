import { z } from "zod";
import { brandSchema, type Brand } from "./schemas";
const field = z.object({
  value: z.string().min(1).max(3000),
  quote: z.string().max(3000),
});
export const brandExtractionSchema = z.object({
  name: field,
  personality: field,
  positioning: field,
  audience: field,
  tone: field,
  values: field,
  messages: field,
  colors: field,
  visual: field,
});
const normalize = (text: string) =>
  text.replace(/\s+/g, " ").trim().toLowerCase();
/** Discard ungrounded model claims. Every populated field needs a quote found in the document. */
export function groundBrand(
  extracted: z.infer<typeof brandExtractionSchema>,
  source: string,
) {
  const brand = {} as Brand;
  const evidence = {} as Record<keyof Brand, string>;
  const normalized = normalize(source);
  for (const key of Object.keys(brandSchema.shape) as (keyof Brand)[]) {
    const { value, quote } = extracted[key];
    const hexes =
      key === "colors" ? value.match(/#[a-f\d]{3,8}\b/gi) || [] : [];
    const supported =
      quote.trim().length >= 8 &&
      normalized.includes(normalize(quote)) &&
      hexes.every((hex) => normalized.includes(hex.toLowerCase())) &&
      value.trim() !== "Not specified in document";
    brand[key] = supported ? value.trim() : "Not specified in document";
    evidence[key] = supported ? quote.trim() : "";
  }
  return { brand: brandSchema.parse(brand), evidence };
}
