# Sprint 1 — AI Quality & Brand Intelligence

Status: **Product review — technical checks passed; Founder acceptance pending. Remote private-preview access is blocked (issue #8).**

Baseline: `feat/sprint0-reliability-quality-gates`, `357df33a60a542693e4164a6d211e9031d414520`. Sprint 0 and Sprint 0.5 are complete per founder context. The older baseline and sprint-selection text in [team guidance](../agent-team/README.md) and [roadmap](../agent-team/roadmap.md) are historical; their approval and safety controls remain applicable. See [role contracts](../agent-team/roles.md).

## Product requirement

For e-commerce founders and marketers, Forma should turn a brand document and product details into a reviewable brand understanding and a coherent, differentiated campaign. Document facts, user edits, missing details, and proposed creative directions must be distinguishable. Product-image fidelity must become measurable without implying that successful rendering proves product identity preservation.

The baseline already supplies evidence quotes, editable Brand Brain fields, missing-field markers, three Hero/Lifestyle/Creative concepts, partial regeneration, duplicate-copy checks, and product-preservation prompts. This sprint improves those behaviors rather than introducing them again.

## Prioritized backlog and ownership

All rows are P0 for the approved bounded sprint. The technical implementation is in Draft PR #9 at `ddd05dce81a2df647a21848f4c252662a13b42e3`. Live progress is tracked in [Sprint hub #4](https://github.com/esraamagdy/campaign-/issues/4); issue status takes precedence over this initial snapshot. The Orchestrator records exact assignees, issue URLs, branch names, and PR evidence in the GitHub workflow; one writing owner per file applies.

| ID | User story and outcome | Implementation owner | Review owner | State at handoff |
| --- | --- | --- | --- | --- |
| S1-01 | I can distinguish extracted evidence, missing information, and my own edits before approving Brand Brain. | Brand Brain Builder | Product + QA | Product review |
| S1-02 | I can trust that unsupported or absent brand details remain visibly uncertain. | Brand Brain Builder | Architect + QA | Product review |
| S1-03 | I receive three distinct concepts serving one coherent, grounded strategy. | Campaign Builder | Product + QA | Product review |
| S1-04 | I can regenerate a requested campaign element without losing unrelated edits. | Campaign Builder | QA | Product review |
| S1-05 | I can evaluate image identity separately from visual appeal without generating new images. | Fidelity framework owner | Product + QA | Product review |
| S1-06 | I can inspect the sprint through issues, technical evidence, and a founder review checklist. | Orchestrator + Product | Founder | Product review |

## Acceptance criteria

### Brand Brain — S1-01 and S1-02

- Every field visibly distinguishes source-backed extraction, missing information, and user-supplied/edited content. A quote demonstrates source occurrence, not automatic semantic truth.
- Editing or clearing a value removes its claim to current source-backed provenance. Historical evidence must not appear to validate the edited value.
- Missing facts remain missing; approval does not silently invent values. Unspecified audience or visual direction is treated as a proposal downstream.
- A newly selected/reuploaded document cannot inherit the previous document's evidence or approval state. Invalid uploads and failed analysis cannot present stale results as analysis of the new document.
- Tests include supported facts, absent facts, unsupported quotes, unsupported color hexes, edits, clearing, reupload, analysis failure, and truncation. Untrusted document instructions cannot override system constraints.
- An annotated synthetic corpus contains at least three documents: comprehensive, sparse, and conflicting/adversarial. Record factual accuracy and unsupported-claim rate with denominators; do not claim that deterministic fixtures validate live semantic extraction.

### Campaign Strategy — S1-03 and S1-04

- Exactly three Hero, Lifestyle, and Creative concepts remain aligned with the approved brand/product. Headlines, captions, and CTAs are meaningfully differentiated; known duplicate fixtures fail validation.
- Missing brand details do not become asserted brand facts. No invented prices, offers, certifications, product capabilities, or audience facts appear in accepted quality fixtures.
- Copy and the corresponding visual concept agree; image instructions preserve the reference product and do not request new advertising text inside the image.
- Full and partial regeneration use the same bounded schema and quality checks. Only the requested field/card changes; unrelated edits remain byte-for-byte intact. Failure retains the previous working campaign and does not trigger automatic paid repair/retry.
- Human quality rubric covers grounding, product specificity, audience relevance, distinctness, copy/visual alignment, and actionability. Proposed future live target: at least 4/5 on each dimension per reviewed campaign, and zero fabricated factual claims. These are provisional targets, not verified results or a semantic guarantee.

### Product Image Fidelity — S1-05

- Deliver a versioned offline rubric, case/report contract, example cases, and deterministic scoring checks. Default operation makes zero paid calls.
- Score silhouette/proportions, packaging/materials, color, logo/existing label text separately from aesthetics/usability on anchored 1–5 scales. Explicitly handle unassessable criteria.
- Wrong/missing/duplicated product, materially changed packaging, invented branding, or materially corrupted existing label text is a hard failure regardless of aesthetics. An unassessable identity dimension cannot silently pass.
- Use synthetic or explicitly rights-cleared assets only. Reports use safe case identifiers and references; never commit customer uploads, credentials, image payloads, or raw private documents.
- Framework completion means the evaluation method works. Live provider fidelity remains **unverified** until a separately authorized real-product evaluation occurs.

## Technical execution and dependencies

1. Architect confirms minimal contracts and baseline behavior; Product/QA fix the quality cases and expected outcomes before prompt changes.
2. Brand Brain Builder updates grounding/provenance and review/reset behavior in [brand helpers](../../lib/brand.ts), [brand API](../../app/api/brand/route.ts), [schemas](../../lib/schemas.ts), and [review UI](../../app/page.tsx), with targeted regression tests.
3. Campaign Builder updates [strategy helpers](../../lib/campaign.ts), [prompts](../../lib/prompts.ts), and [campaign API](../../app/api/campaign/route.ts) with bounded quality checks and regeneration tests. Shared schema changes require coordination with the Brand Brain owner.
4. Fidelity owner builds the offline evaluation framework independently of provider generation. No provider/model change, autonomous judge, or paid evaluation is included.
5. QA independently reviews the integrated diff, runs zero-cost checks, records failures and gaps, and hands the concrete artifact to founder Product review.

Existing Next.js guides must be read before code changes as required by [AGENTS.md](../../AGENTS.md). Planned technical gates: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build -- --webpack`, and scoped fixture browser checks with demo mode, empty `FAL_KEY`, and live tests disabled. Test results belong in the PR/QA evidence; this document does not assert they have run or passed.

## Workflow states

| State | Meaning / exit condition |
| --- | --- |
| Ready | Scope, owner, dependencies, and acceptance criteria are explicit; implementation has not begun. |
| In progress | Assigned owner is implementing the bounded task. |
| Technical QA | Reviewable implementation exists; independent technical verification is pending or underway. |
| Product review | Technical evidence is available and the founder can inspect the product checklist; founder decision is pending. |
| Accepted | Founder explicitly accepted the scoped product outcome, with known gaps recorded. This does not authorize paid calls, merge, or deployment. |
| Blocked | A concrete dependency, failure, or missing required authorization prevents progress; record reason and next owner. |

Technical completion requires passing relevant checks and independent QA evidence. Product acceptance requires a separate founder decision using [the review checklist](sprint-1-product-review.md). Live AI quality is a separate unverified dimension; offline acceptance must preserve that limitation.

## Constraints, cost, and rollback

Implementation is underway under founder authorization. Paid API spend for this sprint remains **$0**; no paid FAL/OpenAI calls are authorized. No merge or public deployment is authorized. Keep previews private and do not assume a preview exists until the Orchestrator records an accessible URL and its mode. Browser-only state, provider choices, upload limits, and current cost guardrails remain in scope for non-regression.

Non-goals: auth, persistence, billing, integrations, new objective/channel/style controls, model/provider comparison, autonomous repair loops, or exact-logo fidelity guarantees. Revert the unmerged sprint commits/branch to the recorded baseline for rollback; no production or data migration is planned.

## Traceability

| Artifact | Location |
| --- | --- |
| Sprint issues / status view | [Sprint hub #4](https://github.com/esraamagdy/campaign-/issues/4) · [Brand Brain #5](https://github.com/esraamagdy/campaign-/issues/5) · [Campaign #6](https://github.com/esraamagdy/campaign-/issues/6) · [Fidelity #7](https://github.com/esraamagdy/campaign-/issues/7) · [QA and review #8](https://github.com/esraamagdy/campaign-/issues/8) |
| Draft PR / technical QA evidence | [Draft PR #9](https://github.com/esraamagdy/campaign-/pull/9); [technical QA report](sprint-1-qa.md) |
| Private fixture preview | [Access status and walkthrough](sprint-1-private-preview.md): local loopback verified; authenticated remote access blocked |
| Founder product review | [Review checklist and decision log](sprint-1-product-review.md) |
