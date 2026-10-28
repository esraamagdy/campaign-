import { z } from "zod";
export const brandSchema = z.object({
  name: z.string().trim().min(1).max(200),
  positioning: z.string().trim().min(1).max(3000),
  audience: z.string().trim().min(1).max(3000),
  tone: z.string().trim().min(1).max(3000),
  values: z.string().trim().min(1).max(3000),
  messages: z.string().trim().min(1).max(3000),
  visual: z.string().trim().min(1).max(3000),
});
export const productSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(4000),
  features: z.string().max(3000),
  benefits: z.string().max(3000),
  price: z.string().max(100),
});
export const campaignSchema = z.object({
  name: z.string(),
  idea: z.string(),
  objective: z.string(),
  audience: z.string(),
  message: z.string(),
  posts: z
    .array(
      z.object({
        title: z.string(),
        concept: z.string(),
        caption: z.string(),
        cta: z.string(),
      }),
    )
    .length(3),
  visuals: z
    .array(
      z.object({ title: z.string(), concept: z.string(), prompt: z.string() }),
    )
    .length(3),
});
export const requestSchema = z.object({
  brand: brandSchema,
  product: productSchema,
  current: campaignSchema.optional(),
  element: z
    .enum([
      "name",
      "idea",
      "objective",
      "audience",
      "message",
      "post0",
      "post1",
      "post2",
      "visual0",
      "visual1",
      "visual2",
    ])
    .optional(),
});
export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export const MAX_DOCUMENT = 5 * 1024 * 1024;
export const MAX_IMAGE = 5 * 1024 * 1024;
