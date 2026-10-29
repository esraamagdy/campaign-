import { Campaign, requestSchema } from "./schemas";
import { z } from "zod";
type Element = z.infer<typeof requestSchema>["element"];
/** Replace only the requested card; preserve every other user edit. */
export function mergeCampaign(
  current: Campaign | undefined,
  fresh: Campaign,
  element: Element,
): Campaign {
  if (!current || !element) return fresh;
  const result = structuredClone(current);
  if (element.startsWith("post")) {
    const i = Number(element[4]);
    const field = element.split(".")[1] as
      keyof Campaign["posts"][number] | undefined;
    if (field) result.posts[i][field] = fresh.posts[i][field];
    else result.posts[i] = fresh.posts[i];
  } else if (element.startsWith("visual")) {
    const i = Number(element.at(-1));
    result.visuals[i] = fresh.visuals[i];
  } else {
    const key = element as
      "name" | "idea" | "objective" | "audience" | "message";
    result[key] = fresh[key];
  }
  return result;
}

/** A successful schema parse must also contain useful, distinct advertising copy. */
export function validateStrategy(campaign: Campaign) {
  const text = [
    campaign.name,
    campaign.idea,
    campaign.objective,
    campaign.audience,
    campaign.message,
    ...campaign.posts.flatMap((post) => Object.values(post)),
    ...campaign.visuals.flatMap((visual) => Object.values(visual)),
  ];
  if (text.some((value) => !value.trim()))
    throw new Error("Campaign contains empty elements.");
  for (const field of ["headline", "caption", "cta"] as const) {
    const normalized = campaign.posts.map((post) =>
      post[field]
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ""),
    );
    if (new Set(normalized).size !== 3)
      throw new Error("Campaign contains repeated advertising copy.");
  }
  return campaign;
}
