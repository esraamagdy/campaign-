import { NextResponse } from "next/server";
import { BodyTooLargeError } from "./http";
import { UsageError } from "./usage";
import { ImageResultError } from "./providers/image-result";
import { ProviderError } from "./providers/fal";
export function apiError(error: unknown, fallback: string, status = 502) {
  if (error instanceof BodyTooLargeError)
    return NextResponse.json({ error: error.message }, { status: 413 });
  if (
    error instanceof UsageError ||
    error instanceof ProviderError ||
    error instanceof ImageResultError
  )
    return NextResponse.json(
      { error: error.message },
      { status: error instanceof ImageResultError ? 502 : error.status },
    );
  if (
    error instanceof Error &&
    ["TimeoutError", "AbortError"].includes(error.name)
  )
    return NextResponse.json(
      {
        error:
          "AI generation timed out. No automatic retry was made. Please try again.",
      },
      { status: 504 },
    );
  return NextResponse.json({ error: fallback }, { status });
}
