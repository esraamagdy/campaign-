import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { MAX_DOCUMENT, brandSchema } from "@/lib/schemas";
import { demoBrand } from "@/lib/mock";
import { generate } from "@/lib/ai";
import { BodyTooLargeError, readBody } from "@/lib/http";
export const runtime = "nodejs";
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
    const demo = !process.env.OPENAI_API_KEY;
    const brand = demo
      ? demoBrand(text)
      : await generate(
          `Analyze this brand document. Return JSON with string fields name, positioning, audience, tone, values, messages, visual. Identify uncertain information as unspecified. Document: ${JSON.stringify(text.slice(0, 30000))}`,
          brandSchema,
        );
    return NextResponse.json({ brand, demo });
  } catch (error) {
    if (error instanceof BodyTooLargeError)
      return NextResponse.json({ error: error.message }, { status: 413 });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not analyze this file.",
      },
      { status: 422 },
    );
  }
}
