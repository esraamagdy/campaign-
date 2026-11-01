# Sprint 1 offline quality evaluation

Status: authored synthetic calibration only. No real-provider quality has been verified.
Fixtures and reports contain no customer uploads. The evaluator makes no network calls,
judges no pixels, and does not generate images. `pass` means this individual scorecard
meets thresholds; it does not mean any model or product is generally faithful.

## Product fidelity scorecard

Score geometry/silhouette, packaging/container structure, color/material appearance,
existing logo/label text, and scene aesthetics separately. Packaging includes a bottle's
container; only an object without packaging may exclude it. Exclude lettering only when
the reference genuinely has none. Hidden, cropped, glare-obscured or illegible details are
`unassessable`, never `not-applicable`. Every entry needs a reviewer reason.

| Score | Anchor                                                    |
| ----- | --------------------------------------------------------- |
| 1     | Substantially altered or unusable                         |
| 2     | Major visible error                                       |
| 3     | Recognizable but requires meaningful correction           |
| 4     | Minor differences; usable after review                    |
| 5     | Faithful within the visible reference and requested scene |

Identity dimensions must each score at least 4; aesthetics must score at least 3.
No averaging. Wrong product, changed package form, changed material logo/text, invented
certification, duplication, or major occlusion is a blocking defect regardless of scores.
Any defect or below-threshold dimension fails. Otherwise an unassessable dimension needs
review. Otherwise the scorecard passes. Invalid/contradictory records throw validation
errors rather than producing a passing verdict. Manifest applicability must be set from
the reference before scoring outputs; do not change it to improve a result.

`manifest.json` defines three synthetic product cases, not actual generated assets.
`tests/fixtures/quality/calibration.json` contains explicitly authored examples of pass,
fail and needs-review. These calibrate logic only. No photograph or model output is claimed.

## Brand and campaign benchmark protocol

Use the three TXT documents and `brand-expectations.json` as frozen synthetic gold
annotations. Rich, sparse, and conflicting/adversarial cases distinguish extraction from
invention. Expected excerpts in annotations describe supported facts; exact citation
validation must still use the full document. The conflicting case deliberately defeats
substring-only evidence checking: retired colors and malicious instructions occur in
the source but are not current guidelines. Add truncation-boundary and unrelated-quote
unit cases when changing extraction. Do not claim complete semantic verification from
lexical checks or authored responses.

Proposed diagnostic targets: zero unsupported facts labeled sourced, all emitted sourced
quotes valid, at least 90% recall of unambiguous annotated facts within the analyzed
region, and explicit disclosure of missing/conflicting fields. Edits must invalidate old
evidence attribution. User-provided facts and creative proposals must remain distinct.
These are small-corpus acceptance targets, not measured performance or broad guarantees.

For each campaign review factual discipline, brand specificity, product specificity,
distinct selling angles, post/visual alignment, and useful copy on the same 1–5 scale.
Target each dimension at least 4, zero invented factual claims, three paired Hero,
Lifestyle, Creative concepts, and exact preservation of unrelated edits on regeneration.
Do not average away factual failures. Two reviewers independently assess semantic quality;
resolve factual disagreements and score gaps greater than one before signoff.

Record baseline/candidate commit, fixture identifier, prompt/schema version, reviewer,
mode, per-case result, and limitations in the report. Frozen authored outputs test the
evaluation machinery, not provider quality. Compare baseline/candidate blind when real
authorized outputs exist. Three documents cannot establish general performance.

## Reproduction and paid-call boundary

Run `node --import tsx tests/evaluation.test.ts`; full regression gates remain the parent
task's responsibility. Existing `test:e2e:live` uses mocked FAL interception: it verifies
integration only. No real FAL call is authorized by these documents or an
`authorized-live` provenance label. Such a label is descriptive metadata, not permission.

Any future real test needs founder-approved reference, exact prompt/model, one image
maximum per run, a fixed USD budget, no automatic retry, and private artifact handling.
Do not use the three-image campaign flow for a one-image cap. Do not commit private
documents, prompts containing private uploads, image payloads, signed URLs or credentials.
Use report case IDs, request IDs and sanitized notes. Keep live evaluation explicitly
pending until that separately approved work occurs.
