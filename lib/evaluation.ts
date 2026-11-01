import { z } from "zod";

export const identityDimensions = [
  "geometry",
  "packaging",
  "colorMaterial",
  "logoText",
] as const;
export const dimensions = [...identityDimensions, "aesthetics"] as const;
const note = z.string().trim().min(1).max(1000);
const caseSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    description: note,
    packagingApplicable: z.boolean(),
    logoTextApplicable: z.boolean(),
  })
  .strict();
export const evaluationManifestSchema = z
  .object({
    version: z.literal(1),
    provenance: z.literal("synthetic-authored"),
    liveQualityVerified: z.literal(false),
    cases: z.array(caseSchema).min(1).max(30),
  })
  .strict()
  .superRefine((manifest, context) => {
    if (
      new Set(manifest.cases.map((item) => item.id)).size !==
      manifest.cases.length
    )
      context.addIssue({ code: "custom", message: "Case IDs must be unique" });
  });
const assessmentSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("scored"),
      score: z.number().int().min(1).max(5),
      reason: note,
    })
    .strict(),
  z.object({ status: z.literal("not-applicable"), reason: note }).strict(),
  z.object({ status: z.literal("unassessable"), reason: note }).strict(),
]);
export const fidelityScorecardSchema = z
  .object({
    caseId: z.string().max(80),
    provenance: z.enum(["authored-calibration", "authorized-live"]),
    reviewer: z.string().trim().min(1).max(100),
    blockingDefects: z.array(note).max(20),
    scores: z
      .object({
        geometry: assessmentSchema,
        packaging: assessmentSchema,
        colorMaterial: assessmentSchema,
        logoText: assessmentSchema,
        aesthetics: assessmentSchema,
      })
      .strict(),
  })
  .strict();
export type EvaluationVerdict = "pass" | "needs-review" | "fail";

/** Pure offline scorecard validation; this never calls a provider or judges pixels. */
export function evaluateFidelity(
  manifestInput: unknown,
  scorecardInput: unknown,
): {
  verdict: EvaluationVerdict;
  provenance: "authored-calibration" | "authorized-live";
  liveQualityVerified: false;
  reasons: string[];
} {
  const manifest = evaluationManifestSchema.parse(manifestInput);
  const card = fidelityScorecardSchema.parse(scorecardInput);
  const product = manifest.cases.find((item) => item.id === card.caseId);
  if (!product) throw new Error("Unknown evaluation case");
  const failures = [...card.blockingDefects];
  const review: string[] = [];
  for (const dimension of dimensions) {
    const score = card.scores[dimension];
    const applicable =
      dimension === "packaging"
        ? product.packagingApplicable
        : dimension === "logoText"
          ? product.logoTextApplicable
          : true;
    if (score.status === "not-applicable") {
      if (applicable)
        throw new Error(`Cannot exclude applicable dimension: ${dimension}`);
      continue;
    }
    if (!applicable)
      throw new Error(`Use not-applicable for absent dimension: ${dimension}`);
    if (score.status === "unassessable")
      review.push(`${dimension}: unassessable`);
    else if (score.score < (dimension === "aesthetics" ? 3 : 4))
      failures.push(`${dimension}: below acceptance threshold`);
  }
  return {
    verdict: failures.length ? "fail" : review.length ? "needs-review" : "pass",
    provenance: card.provenance,
    // A scorecard is a human assessment, never evidence of general model quality.
    liveQualityVerified: false,
    reasons: [...failures, ...review],
  };
}
