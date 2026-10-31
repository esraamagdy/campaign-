import { z } from "zod";
import { brandSchema, type Brand } from "./schemas";

export const MISSING_BRAND_VALUE = "Not specified in document";
export const brandKeys = Object.keys(brandSchema.shape) as (keyof Brand)[];
const fieldReviewSchema = z.object({
  origin: z.enum(["document", "user", "missing", "demo"]),
  status: z.enum(["needs-review", "missing", "demo"]),
  quote: z.string().max(3000),
  locator: z
    .object({
      start: z.number().int().min(0).max(30000),
      end: z.number().int().min(0).max(30000),
    })
    .optional(),
  reason: z.string().max(200).optional(),
});
export const brandReviewSchema = z.object({
  name: fieldReviewSchema,
  personality: fieldReviewSchema,
  colors: fieldReviewSchema,
  positioning: fieldReviewSchema,
  audience: fieldReviewSchema,
  tone: fieldReviewSchema,
  values: fieldReviewSchema,
  messages: fieldReviewSchema,
  visual: fieldReviewSchema,
});
export type BrandReview = z.infer<typeof brandReviewSchema>;

export function isMissingBrandValue(value: string) {
  return !value.trim() || value.trim() === MISSING_BRAND_VALUE;
}

/** Compatibility metadata: evidence presence is not proof of semantic support. */
export function createBrandReview(
  brand: Brand,
  evidence: Partial<Record<keyof Brand, string>> = {},
  demo = false,
): BrandReview {
  return Object.fromEntries(
    brandKeys.map((key) => {
      const missing = isMissingBrandValue(brand[key]);
      const quote =
        !missing && !demo ? (evidence[key] || "").slice(0, 3000) : "";
      return [
        key,
        {
          origin: missing
            ? "missing"
            : demo
              ? "demo"
              : quote
                ? "document"
                : "user",
          status: missing ? "missing" : demo ? "demo" : "needs-review",
          quote,
        },
      ];
    }),
  ) as BrandReview;
}

/** Any edit removes document attribution, including editing back to the old value. */
export function editBrandField(
  review: BrandReview,
  key: keyof Brand,
  value: string,
): BrandReview {
  const missing = isMissingBrandValue(value);
  return {
    ...review,
    [key]: {
      origin: missing ? "missing" : "user",
      status: missing ? "missing" : "needs-review",
      quote: "",
    },
  };
}

export function revertBrandField(
  review: BrandReview,
  key: keyof Brand,
  originalReview: BrandReview,
): BrandReview {
  return { ...review, [key]: structuredClone(originalReview[key]) };
}
