import { NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai";
import { usageSnapshot } from "@/lib/usage";
export const dynamic = "force-dynamic";
export function GET() {
  try {
    const { demo, textModel, imageModel, imageQuality } = aiConfig();
    const { state, textLimit, imageLimit } = usageSnapshot();
    return NextResponse.json(
      {
        demo,
        textModel,
        imageModel,
        imageQuality,
        textRemaining: Math.max(0, textLimit - state.text),
        imagesRemaining: Math.max(0, imageLimit - state.image),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid AI configuration.",
      },
      { status: 503 },
    );
  }
}
