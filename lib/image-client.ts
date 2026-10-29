import type { GeneratedImage } from "./schemas";
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object";
const safeId = (value: unknown) =>
  typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
    ? value
    : undefined;
/** Validate the API contract before changing React state; never log image payloads. */
export async function readImageResponse(
  response: Response,
): Promise<GeneratedImage> {
  const requestId = safeId(response.headers.get("x-forma-request-id"));
  const suffix = requestId ? ` Reference: ${requestId}.` : "";
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      `Image request returned an unreadable response (HTTP ${response.status}).${suffix}`,
    );
  }
  if (!response.ok)
    throw new Error(
      `${record(payload) && typeof payload.error === "string" ? payload.error : `Image request failed (HTTP ${response.status}).`}${suffix}`,
    );
  const image = record(payload) && record(payload.image) ? payload.image : null;
  if (
    !image ||
    typeof image.dataUrl !== "string" ||
    image.dataUrl.length > 26 * 1024 * 1024 ||
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      image.dataUrl,
    ) ||
    typeof image.demo !== "boolean" ||
    typeof image.model !== "string"
  )
    throw new Error(`The server returned no valid image data.${suffix}`);
  return {
    dataUrl: image.dataUrl,
    demo: image.demo,
    model: image.model,
    requestId: requestId || safeId(image.requestId),
  };
}
