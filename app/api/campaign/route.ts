import { NextResponse } from "next/server";
import { z } from "zod";
import { requestSchema, campaignSchema } from "@/lib/schemas";
import { demoCampaign } from "@/lib/mock";
import { aiConfig, generate } from "@/lib/ai";
import { mergeCampaign, validateStrategy } from "@/lib/campaign";
import { readBody } from "@/lib/http";
import { strategyPrompt } from "@/lib/prompts";
import { apiError } from "@/lib/api-error";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: Request) {
  try {
    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder().decode(await readBody(req, 120000)));
    } catch (error) {
      if (error instanceof SyntaxError)
        return NextResponse.json(
          { error: "Provide a valid JSON request." },
          { status: 400 },
        );
      throw error;
    }
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Review the required brand and product fields." },
        { status: 400 },
      );
    const { brand, product, current, element } = parsed.data;
    if (element && !current)
      return NextResponse.json(
        { error: "Generate a campaign before regenerating an element." },
        { status: 400 },
      );
    const { demo } = aiConfig();
    let fresh = demoCampaign(brand, product);
    if (!demo) {
      const prompt = strategyPrompt(brand, product, current, element);
      if (current && element) {
        fresh = structuredClone(current);
        if (element.startsWith("post")) {
          const index = Number(element[4]);
          const field = element.split(".")[1] as
            keyof (typeof fresh.posts)[number] | undefined;
          if (field) {
            const result = await generate(
              prompt,
              z.object({ value: z.string().min(1).max(4000) }),
            );
            fresh.posts[index][field] = result.value;
          } else
            fresh.posts[index] = await generate(
              prompt,
              campaignSchema.shape.posts.element,
            );
        } else if (element.startsWith("visual"))
          fresh.visuals[Number(element.at(-1))] = await generate(
            prompt,
            campaignSchema.shape.visuals.element,
          );
        else {
          const key = element as
            "name" | "idea" | "objective" | "audience" | "message";
          fresh[key] = (
            await generate(
              prompt,
              z.object({ value: z.string().min(1).max(4000) }),
            )
          ).value;
        }
      } else {
        fresh = await generate(prompt, campaignSchema);
        validateStrategy(fresh);
      }
    } else if (current) {
      fresh.name += " — a fresh perspective";
      fresh.idea = `A new angle on ${product.name}: ${product.benefits || product.description}`;
      fresh.objective = `Build consideration of ${product.name} through distinct product-led stories.`;
      fresh.audience = `${brand.audience} Proposed focus: first-time product explorers.`;
      fresh.message = `Make space for ${product.name}. ${product.benefits || product.description}`;
      fresh.posts = fresh.posts.map((p, i) => ({
        ...p,
        title: `${p.title}: a fresh perspective`,
        headline: `${["A closer look at", "In good company with", "A fresh perspective on"][i]} ${product.name}`,
        caption: `${["Look at the details.", "Picture the possibilities.", "Try a different perspective."][i]} ${product.name}: ${product.benefits || product.description}`,
        cta: ["See the product", "Explore the story", "Find your inspiration"][
          i
        ],
      }));
      fresh.visuals = fresh.visuals.map((v) => ({
        ...v,
        prompt: `A new camera angle. ${v.prompt}`,
      }));
    }
    return NextResponse.json(
      { campaign: mergeCampaign(current, fresh, element), demo },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(
      error,
      "Campaign generation failed or returned repetitive content. Please try again.",
    );
  }
}
