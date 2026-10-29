import "server-only";
export type ImageContext = { requestId: string; index?: number };
export type ImageCode =
  | "invalid_response"
  | "missing_image"
  | "invalid_data_uri"
  | "invalid_base64"
  | "untrusted_url"
  | "download_failed"
  | "image_too_large"
  | "unsupported_format"
  | "decode_failed"
  | "provider_failed"
  | "request_failed"
  | "timeout"
  | "usage_limit";
type Event = {
  stage: "received" | "provider_response" | "decoded" | "completed" | "failed";
  code?: ImageCode;
  providerStatus?: number;
  httpStatus?: number;
  providerRequestId?: string;
  imageCount?: number;
  source?: "inline" | "hosted" | "missing";
  declaredMime?:
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "application/octet-stream"
    | "other"
    | "unspecified";
  format?: "png" | "jpeg" | "webp";
  bytes?: number;
  width?: number;
  height?: number;
};
export function safeRequestId(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value)
    ? value
    : undefined;
}
/** Deliberate allowlist: never log exception objects, URLs, prompts, keys or image bytes. */
export function logImage(context: ImageContext, event: Event) {
  const record = {
    requestId: safeRequestId(context.requestId),
    index: context.index,
    stage: event.stage,
    code: event.code,
    providerStatus: event.providerStatus,
    httpStatus: event.httpStatus,
    providerRequestId: safeRequestId(event.providerRequestId),
    imageCount: event.imageCount,
    source: event.source,
    declaredMime: event.declaredMime,
    format: event.format,
    bytes: event.bytes,
    width: event.width,
    height: event.height,
  };
  if (event.stage === "failed")
    console.error("[forma:image]", JSON.stringify(record));
  else console.info("[forma:image]", JSON.stringify(record));
}
