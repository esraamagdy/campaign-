import { NextResponse } from "next/server";
import { requestSchema, campaignSchema } from "@/lib/schemas";
import { demoCampaign } from "@/lib/mock";
import { generate } from "@/lib/ai";
import { mergeCampaign } from "@/lib/campaign";
import { BodyTooLargeError, readBody } from "@/lib/http";
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length")) > 100000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const parsed = requestSchema.safeParse(
      JSON.parse(new TextDecoder().decode(await readBody(req, 100000))),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: "Review the required brand and product fields." },
        { status: 400 },
      );
    const { brand, product, current, element } = parsed.data;
    const demo = !process.env.OPENAI_API_KEY;
    const fresh = demo
      ? demoCampaign(brand, product)
      : await generate(
          `Create a campaign. Return {name,idea,objective,audience,message,posts:[{title,concept,caption,cta}] (exactly 3),visuals:[{title,concept,prompt}] (exactly 3)}. All leaf values are strings. Brand and product: ${JSON.stringify({ brand, product })}. ${current ? `Previous campaign: ${JSON.stringify(current)}. Create a fresh alternative${element ? ` for ${element}` : ""}.` : ""}`,
          campaignSchema,
        );
    if (demo && current) {
      fresh.name += " — a fresh perspective";
      fresh.objective = `Build awareness and inspire discovery of ${product.name} through an everyday ritual story.`;
      fresh.audience = `${brand.audience} Focus on shoppers discovering ${product.name} for the first time.`;
      fresh.message = `Make everyday moments your own with ${product.name}. ${product.benefits || product.description}`;
      fresh.idea = `Meet your next everyday favorite: ${product.name}. A campaign about making space for what you love.`;
      fresh.posts = fresh.posts.map((p) => ({
        ...p,
        title: `${p.title}: a fresh perspective`,
        caption: `Meet ${product.name}. A little inspiration for your everyday. ${product.benefits}`,
        concept: `A fresh perspective: ${p.concept}`,
      }));
      fresh.visuals = fresh.visuals.map((v) => ({
        ...v,
        title: `${v.title}: a new angle`,
        concept: `A new angle on ${v.concept}`,
        prompt: `Alternative composition, overhead perspective. ${v.prompt}`,
      }));
    }
    const campaign = mergeCampaign(current, fresh, element);
    return NextResponse.json({ campaign, demo });
  } catch (error) {
    if (error instanceof BodyTooLargeError)
      return NextResponse.json({ error: error.message }, { status: 413 });
    if (error instanceof SyntaxError)
      return NextResponse.json(
        { error: "Provide a valid JSON request." },
        { status: 400 },
      );
    return NextResponse.json(
      {
        error:
          "Campaign generation failed. Check the server AI configuration or try again.",
      },
      { status: 502 },
    );
  }
}
