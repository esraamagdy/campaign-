import { randomUUID } from "node:crypto";
import { logImage, type ImageContext } from "@/lib/image-diagnostics";
import { ImageResultError } from "@/lib/providers/image-result";
import { UsageError } from "@/lib/usage";
import { ProviderError } from "@/lib/providers/fal";
import { NextResponse } from "next/server";
import { MAX_IMAGE, imageRequestSchema } from "@/lib/schemas";
import { readBody } from "@/lib/http";
import { validateReference } from "@/lib/uploads";
import { aiConfig, generateImage } from "@/lib/ai";
import { imagePrompt } from "@/lib/prompts";
import { apiError } from "@/lib/api-error";
export const runtime = "nodejs";
export const maxDuration = 240;
async function handleImageRequest(req: Request, context: ImageContext) {
  const body = await readBody(req, MAX_IMAGE + 100000);
  let form: FormData;
  try {
    form = await new Response(Buffer.from(body), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
  } catch {
    return NextResponse.json(
      { error: "Use a multipart request with a product image." },
      { status: 400 },
    );
  }
  let metadata: unknown;
  try {
    metadata = JSON.parse(String(form.get("metadata")));
  } catch {
    return NextResponse.json(
      { error: "Provide valid image-generation details." },
      { status: 400 },
    );
  }
  const parsed = imageRequestSchema.safeParse(metadata);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Review the brand, product, and visual direction." },
      { status: 400 },
    );
  let reference: File;
  try {
    reference = await validateReference(form.get("image"));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid reference image.",
      },
      { status: 400 },
    );
  }
  context.index = parsed.data.index;
  const { demo } = aiConfig();
  if (demo) {
    const dataUrl = `data:${reference.type};base64,${Buffer.from(await reference.arrayBuffer()).toString("base64")}`;
    return NextResponse.json(
      {
        image: {
          dataUrl,
          demo: true,
          model: "demo-reference",
          requestId: context.requestId,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
  const { brand, product, visual, index, ad } = parsed.data;
  const image = await generateImage(
    reference,
    imagePrompt(brand, product, visual, index, ad),
    context,
  );
  return NextResponse.json(
    { image: { ...image, demo: false, requestId: context.requestId } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const context: ImageContext = { requestId: randomUUID() };
  logImage(context, { stage: "received" });
  try {
    const response = await handleImageRequest(req, context);
    response.headers.set("X-Forma-Request-Id", context.requestId);
    logImage(context, {
      stage: response.ok ? "completed" : "failed",
      ...(response.ok ? {} : { code: "request_failed" as const }),
      httpStatus: response.status,
    });
    return response;
  } catch (error) {
    logImage(context, {
      stage: "failed",
      code:
        error instanceof UsageError
          ? "usage_limit"
          : error instanceof ImageResultError
            ? error.code
            : error instanceof ProviderError
              ? "provider_failed"
              : error instanceof Error &&
                  ["TimeoutError", "AbortError"].includes(error.name)
                ? "timeout"
                : "request_failed",
    });
    const response = apiError(
      error,
      "Image generation failed. Check the server AI configuration and request reference before retrying.",
    );
    response.headers.set("X-Forma-Request-Id", context.requestId);
    return response;
  }
}
