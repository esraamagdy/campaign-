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
    const i = Number(element.at(-1));
    result.posts[i] = fresh.posts[i];
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
