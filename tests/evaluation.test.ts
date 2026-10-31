import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateFidelity, evaluationManifestSchema } from "../lib/evaluation";
const manifest = JSON.parse(
  readFileSync(
    new URL("../docs/evaluations/sprint-1/manifest.json", import.meta.url),
    "utf8",
  ),
);
const cards = JSON.parse(
  readFileSync(
    new URL("./fixtures/quality/calibration.json", import.meta.url),
    "utf8",
  ),
);

test("authored calibration distinguishes pass, hard failure and unassessable", () => {
  assert.deepEqual(
    cards.map((card: unknown) => evaluateFidelity(manifest, card).verdict),
    ["pass", "fail", "needs-review"],
  );
  for (const card of cards) {
    const result = evaluateFidelity(manifest, card);
    assert.equal(result.provenance, "authored-calibration");
    assert.equal(result.liveQualityVerified, false);
  }
});
test("identity cannot be averaged away or excluded when present", () => {
  const card = structuredClone(cards[1]);
  card.blockingDefects = [];
  assert.equal(evaluateFidelity(manifest, card).verdict, "fail");
  card.scores.logoText = {
    status: "not-applicable",
    reason: "Reviewer wants to skip lettering",
  };
  assert.throws(() => evaluateFidelity(manifest, card), /Cannot exclude/);
  card.scores.logoText = {
    status: "unassessable",
    reason: "Unreadable reference",
  };
  assert.equal(evaluateFidelity(manifest, card).verdict, "needs-review");
});
test("blocking defect overrides high scores and unknown cases fail validation", () => {
  const card = structuredClone(cards[0]);
  card.blockingDefects = ["Wrong product"];
  assert.equal(evaluateFidelity(manifest, card).verdict, "fail");
  card.caseId = "unknown";
  assert.throws(() => evaluateFidelity(manifest, card), /Unknown/);
});
test("bounded schema rejects duplicate cases, bad scores, missing dimensions and dishonest manifest", () => {
  assert.equal(
    evaluationManifestSchema.safeParse({
      ...manifest,
      cases: [manifest.cases[0], manifest.cases[0]],
    }).success,
    false,
  );
  assert.equal(
    evaluationManifestSchema.safeParse({
      ...manifest,
      liveQualityVerified: true,
    }).success,
    false,
  );
  for (const score of [0, 6, 4.5, "5"]) {
    const card = structuredClone(cards[0]);
    card.scores.geometry.score = score;
    assert.throws(() => evaluateFidelity(manifest, card));
  }
  const card = structuredClone(cards[0]);
  delete card.scores.geometry;
  assert.throws(() => evaluateFidelity(manifest, card));
});
