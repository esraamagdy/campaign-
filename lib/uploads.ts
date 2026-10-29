import sharp from "sharp";
import { MAX_IMAGE } from "./schemas";
export async function validateReference(
  file: FormDataEntryValue | null,
): Promise<File> {
  if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE)
    throw new Error("Upload a nonempty product reference image under 5 MB.");
  const extensions: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/webp": "webp",
  };
  if (!extensions[file.type])
    throw new Error("Reference image must be PNG, JPG, or WebP.");
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer, {
      limitInputPixels: 20000000,
      animated: false,
    });
    const meta = await image.metadata();
    if (
      meta.format !== extensions[file.type] ||
      !meta.width ||
      !meta.height ||
      meta.width * meta.height > 20000000
    )
      throw new Error();
    await image.resize({ width: 1, height: 1, fit: "inside" }).toBuffer();
  } catch {
    throw new Error(
      "Cannot decode this reference image. Use a valid PNG, JPG, or WebP up to 20 megapixels.",
    );
  }
  return file;
}
