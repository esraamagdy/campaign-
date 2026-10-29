import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { MAX_DOCUMENT } from "@/lib/schemas";
import { brandExtractionSchema, groundBrand } from "@/lib/brand";
import { demoBrand } from "@/lib/mock";
import { generate, aiConfig } from "@/lib/ai";
import { brandPrompt } from "@/lib/prompts";
import { apiError } from "@/lib/api-error";
import { BodyTooLargeError, readBody } from "@/lib/http";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length")) > MAX_DOCUMENT + 100000)
      return NextResponse.json(
        { error: "Document must be under 5 MB." },
        { status: 413 },
      );
    const body = await readBody(req, MAX_DOCUMENT + 100000);
    const form = await new Response(Buffer.from(body), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_DOCUMENT)
      return NextResponse.json(
        { error: "Upload a nonempty document under 5 MB." },
        { status: 400 },
      );
    const ext = file.name.split(".").pop()?.toLowerCase();
    const types: Record<string, string[]> = {
      pdf: ["application/pdf"],
      docx: [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      txt: ["text/plain"],
    };
    if (!ext || !types[ext]?.includes(file.type))
      return NextResponse.json(
        {
          error:
            "Please upload a PDF, DOCX, or TXT file with the correct file type.",
        },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";
    if (ext === "pdf") {
      if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-")))
        throw new Error("Invalid PDF document.");
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        text = (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    } else if (ext === "docx") {
      if (buffer[0] !== 0x50 || buffer[1] !== 0x4b)
        throw new Error("Invalid DOCX document.");
      text = (await mammoth.extractRawText({ buffer })).value;
    } else {
      if (buffer.includes(0)) throw new Error("Invalid text document.");
      text = buffer.toString("utf8");
    }
    if (text.trim().length < 20)
      return NextResponse.json(
        {
          error:
            "Not enough readable text. Use a text-based PDF, DOCX, or TXT with at least 20 characters.",
        },
        { status: 400 },
      );
    const { demo } = aiConfig();
    const result = demo
      ? { brand: demoBrand(text), evidence: {} }
      : groundBrand(
          await generate(
            brandPrompt(text.slice(0, 30000)),
            brandExtractionSchema,
          ),
          text.slice(0, 30000),
        );
    return NextResponse.json(
      { ...result, demo, truncated: text.length > 30000 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BodyTooLargeError)
      return apiError(error, "Document too large.");
    // Parser errors should not expose internals; provider and usage errors retain useful safe messages.
    return apiError(
      error,
      "Could not analyze this document. Check it is readable and the server AI configuration is valid.",
      422,
    );
  }
}
