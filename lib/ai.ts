import "server-only";
import { z } from "zod";
import { falText, falImage } from "./providers/fal";
import { reserveUsage } from "./usage";
export { aiConfig } from "./providers/config";
export async function generate<T>(
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const release = reserveUsage("text");
  try {
    return await falText.generate(prompt, schema);
  } finally {
    release();
  }
}
export async function generateImage(reference: File, prompt: string) {
  const release = reserveUsage("image");
  try {
    return await falImage.edit(reference, prompt);
  } finally {
    release();
  }
}
