import "server-only";
import sharp from "sharp";
import { readBody } from "../http";
import {
  logImage,
  type ImageCode,
  type ImageContext,
} from "../image-diagnostics";
export class ImageResultError extends Error {
  constructor(
    public code: ImageCode,
    message: string,
  ) {
    super(message);
  }
}
const MAX_OUTPUT = 18 * 1024 * 1024;
function trustedUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ImageResultError(
      "untrusted_url",
      "FAL returned an invalid image address.",
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !(url.hostname === "fal.media" || url.hostname.endsWith(".fal.media"))
  )
    throw new ImageResultError(
      "untrusted_url",
      "FAL returned an untrusted image address.",
    );
  return url;
}
/** Accept FAL's direct HTTP payload or the documented SDK {data,...} envelope. */
export async function decodeFalImage(
  result: unknown,
  context?: ImageContext,
): Promise<string> {
  const outer =
    result && typeof result === "object"
      ? (result as Record<string, unknown>)
      : {};
  const data =
    outer.data && typeof outer.data === "object"
      ? (outer.data as Record<string, unknown>)
      : outer;
  const images = Array.isArray(data.images) ? data.images : [];
  const image =
    images[0] && typeof images[0] === "object"
      ? (images[0] as Record<string, unknown>)
      : {};
  if (Array.isArray(data.has_nsfw_concepts) && data.has_nsfw_concepts[0])
    throw new ImageResultError(
      "provider_failed",
      "FAL could not return this image because of its safety checks. Revise the direction before trying again.",
    );
  const value = image.url;
  if (typeof value !== "string" || !value.trim())
    throw new ImageResultError(
      "missing_image",
      "FAL completed but returned no image data. Check the request reference in the server logs before retrying.",
    );
  const url = value.trim();
  let buffer: Buffer;
  let declared = "";
  const source = url.startsWith("data:") ? "inline" : "hosted";
  if (source === "inline") {
    if (url.length > Math.ceil(MAX_OUTPUT / 3) * 4 + 16384)
      throw new ImageResultError(
        "image_too_large",
        "The generated image exceeds the download size limit.",
      );
    const comma = url.indexOf(",");
    if (comma < 0 || comma > 256)
      throw new ImageResultError(
        "invalid_data_uri",
        "FAL returned an invalid inline image.",
      );
    const header = url
      .slice(5, comma)
      .split(";")
      .map((part) => part.trim().toLowerCase());
    declared = header[0];
    if (!header.includes("base64"))
      throw new ImageResultError(
        "invalid_data_uri",
        "FAL returned an inline image without base64 encoding.",
      );
    let base64: string;
    try {
      base64 = decodeURIComponent(url.slice(comma + 1)).replace(/\s/g, "");
    } catch {
      throw new ImageResultError(
        "invalid_base64",
        "FAL returned invalid base64 image data.",
      );
    }
    if (
      !base64 ||
      base64.length % 4 === 1 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)
    )
      throw new ImageResultError(
        "invalid_base64",
        "FAL returned invalid base64 image data.",
      );
    buffer = Buffer.from(base64, "base64");
    if (
      buffer.toString("base64").replace(/=+$/, "") !== base64.replace(/=+$/, "")
    )
      throw new ImageResultError(
        "invalid_base64",
        "FAL returned invalid base64 image data.",
      );
  } else {
    const parsed = trustedUrl(url);
    let response: Response;
    try {
      response = await fetch(parsed.toString(), {
        signal: AbortSignal.timeout(30000),
        redirect: "error",
      });
    } catch {
      throw new ImageResultError(
        "download_failed",
        "FAL generated the image, but its media download failed. Check server network access before retrying.",
      );
    }
    if (!response.ok)
      throw new ImageResultError(
        "download_failed",
        `FAL generated the image, but its media download failed (HTTP ${response.status}).`,
      );
    declared = (response.headers.get("content-type") || "")
      .split(";")[0]
      .trim()
      .toLowerCase();
    if (Number(response.headers.get("content-length")) > MAX_OUTPUT)
      throw new ImageResultError(
        "image_too_large",
        "The generated image exceeds the download size limit.",
      );
    try {
      buffer = Buffer.from(await readBody(response, MAX_OUTPUT));
    } catch {
      throw new ImageResultError(
        "download_failed",
        "Could not download the generated image within the size limit.",
      );
    }
  }
  if (buffer.length > MAX_OUTPUT)
    throw new ImageResultError(
      "image_too_large",
      "The generated image exceeds the download size limit.",
    );
  const declaredMime = (
    [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/octet-stream",
    ].includes(declared)
      ? declared
      : declared
        ? "other"
        : "unspecified"
  ) as
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "application/octet-stream"
    | "other"
    | "unspecified";
  if (context)
    logImage(context, {
      stage: "provider_response",
      source,
      declaredMime,
      imageCount: images.length,
      bytes: buffer.length,
    });
  // Trust decoded bytes, not a provider MIME label. Never render SVG/HTML as an image.
  let png: Buffer;
  let width: number | undefined,
    height: number | undefined,
    format: "png" | "jpeg" | "webp";
  try {
    const pipeline = sharp(buffer, {
      limitInputPixels: 20000000,
      animated: false,
    });
    const meta = await pipeline.metadata();
    if (!["png", "jpeg", "webp"].includes(meta.format || ""))
      throw new ImageResultError(
        "unsupported_format",
        "FAL returned an unsupported image format.",
      );
    format = meta.format as typeof format;
    width = meta.width;
    height = meta.height;
    // Decode the whole raster, catching files with valid headers but corrupt image data.
    const decoded = await pipeline.png().toBuffer();
    png = decoded;
  } catch (error) {
    if (error instanceof ImageResultError) throw error;
    throw new ImageResultError(
      "decode_failed",
      "FAL returned image bytes that could not be decoded. Check the request reference in server logs before retrying.",
    );
  }
  if (png.length > MAX_OUTPUT)
    throw new ImageResultError(
      "image_too_large",
      "The decoded image exceeds the download size limit.",
    );
  if (context)
    logImage(context, {
      stage: "decoded",
      format,
      width,
      height,
      bytes: png.length,
    });
  return `data:image/png;base64,${png.toString("base64")}`;
}
