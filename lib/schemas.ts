import { z } from "zod";
export const brandSchema = z.object({
  name: z.string().trim().min(1).max(200),
  personality: z.string().trim().min(1).max(3000),
  colors: z.string().trim().min(1).max(3000),
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
  name: z.string().max(4000),
  idea: z.string().max(4000),
  objective: z.string().max(4000),
  audience: z.string().max(4000),
  message: z.string().max(4000),
  posts: z
    .array(
      z.object({
        title: z.string().max(4000),
        concept: z.string().max(4000),
        headline: z.string().min(1).max(500),
        caption: z.string().max(4000),
        cta: z.string().max(4000),
      }),
    )
    .length(3),
  visuals: z
    .array(
      z.object({
        title: z.string().max(4000),
        concept: z.string().max(4000),
        prompt: z.string().max(4000),
      }),
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
      ...([0, 1, 2] as const).flatMap((i) =>
        (["title", "concept", "headline", "caption", "cta"] as const).map(
          (key) => `post${i}.${key}` as const,
        ),
      ),
    ])
    .optional(),
});
export type Brand = z.infer<typeof brandSchema>;
export type Product = z.infer<typeof productSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export const MAX_DOCUMENT = 5 * 1024 * 1024;
export const MAX_IMAGE = 5 * 1024 * 1024;

export const imageRequestSchema = z.object({
  brand: brandSchema,
  product: productSchema,
  visual: campaignSchema.shape.visuals.element,
  ad: campaignSchema.shape.posts.element,
  index: z.number().int().min(0).max(2),
});
export type GeneratedImage = { dataUrl: string; demo: boolean; model: string };
export type ImageState = {
  image?: GeneratedImage;
  loading?: boolean;
  error?: string;
  stale?: boolean;
};
