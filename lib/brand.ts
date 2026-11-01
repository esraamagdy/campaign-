import { z } from "zod";
import { brandSchema, type Brand } from "./schemas";
import { createBrandReview, MISSING_BRAND_VALUE } from "./brand-review";
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
/** Conservative extractive check. Quote occurrence never establishes semantic entailment. */
export function groundBrand(
  extracted: z.infer<typeof brandExtractionSchema>,
  source: string,
) {
  const brand = {} as Brand;
  const evidence = {} as Record<keyof Brand, string>;
  const normalized = normalize(source);
  const review = createBrandReview(
    Object.fromEntries(
      Object.keys(brandSchema.shape).map((key) => [key, MISSING_BRAND_VALUE]),
    ) as Brand,
  );
  for (const key of Object.keys(brandSchema.shape) as (keyof Brand)[]) {
    const { value, quote } = extracted[key];
    const hexes =
      key === "colors" ? value.match(/#[a-f\d]{3,8}\b/gi) || [] : [];
    const quoteStart = normalized.indexOf(normalize(quote));
    const extractiveMatch =
      quote.trim().length >= 8 &&
      quoteStart >= 0 &&
      normalize(quote).includes(normalize(value)) &&
      hexes.every((hex) => normalized.includes(hex.toLowerCase())) &&
      value.trim() !== "Not specified in document";
    brand[key] = extractiveMatch ? value.trim() : MISSING_BRAND_VALUE;
    evidence[key] = extractiveMatch ? quote.trim() : "";
    review[key] = extractiveMatch
      ? {
          origin: "document",
          status: "needs-review",
          quote: quote.trim(),
          locator: {
            start: quoteStart,
            end: quoteStart + normalize(quote).length,
          },
          reason:
            "Quote located in normalized analyzed text; relevance requires human review.",
        }
      : {
          origin: "missing",
          status: "missing",
          quote: "",
          reason:
            value.trim() === MISSING_BRAND_VALUE
              ? "Not specified in analyzed text."
              : "No conservative extractive match; review the document or supply a value.",
        };
  }
  return { brand: brandSchema.parse(brand), evidence, review };
}
