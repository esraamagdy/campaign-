# Sprint 1 — Founder Product Review

Current state: **In progress**. Implementation is underway; technical QA and founder acceptance are pending. Paid spend is **$0**. Live extraction, strategy quality, and product-image fidelity are **unverified**.

Use this checklist with the [Sprint 1 plan](sprint-1-plan.md). A green test suite supports technical completion; only the founder records product acceptance. Accepting an offline framework does not verify live model quality or authorize paid calls, merge, or public deployment.

## Review entry conditions

- [ ] Orchestrator supplies actual issue and draft PR URLs, commit SHA, technical QA results, and known gaps.
- [ ] A private fixture/demo preview is available, or a reproducible local review path is documented. Preview URL: **pending; none asserted**.
- [ ] Review mode is explicitly demo/fixture, `FAL_KEY` is empty, and live tests are disabled. Do not click live generation to perform this checklist.
- [ ] Only synthetic or rights-cleared test documents/images are used; no customer material is added to GitHub issues or commits.

Record Pass, Fail, or Not verified for each item with case ID, build SHA, observed behavior, and safe evidence. Leave unfinished items unchecked. Exact UI wording may vary, but provenance and uncertainty must remain clear to a marketer.

## Brand Brain review

| Check | Concrete steps | Expected outcome | Result |
| --- | --- | --- | --- |
| B1 — provenance | In the synthetic supported-evidence fixture, analyze a comprehensive document; inspect a populated field and its quote. | Source-backed extraction and matching evidence are visible. Quote occurrence is not presented as proof of semantic truth. Demo sample suggestions remain visibly illustrative. | Pending |
| B2 — missing facts | Analyze the sparse-document fixture without colors or audience details. | Missing fields remain explicitly missing. No invented palette or target audience appears as a brand fact. | Pending |
| B3 — edit | Change a source-backed field to a new user-provided value. | Current value is visibly user edited/supplied; the old quote is no longer shown as evidence supporting the new value. | Pending |
| B4 — clear | Clear an extracted field, then inspect review and continuation behavior. | Cleared value loses source-backed status. Required-field validation is clear; the previous value/evidence is not silently restored or invented. | Pending |
| B5 — reupload | Replace the document with a second fixture containing different brand details; inspect the screen before and after analysis. | Previous document evidence and approval do not carry into the replacement. Successful analysis shows only the new document's state. | Pending |
| B6 — failure | After a successful analysis, use a failed-analysis fixture or invalid replacement file. | A useful error appears; stale evidence is not represented as analysis of the failed replacement. No automatic paid retry occurs. Existing working data, if retained, is clearly tied to its original document. | Pending |
| B7 — uncertainty | Review contradictory/adversarial and truncated-source fixtures. | Unsupported evidence is rejected/flagged, document instructions do not override constraints, and missing/truncated context is visible. Ambiguity is not silently converted to a verified fact. | Pending |

## Campaign Strategy review

| Check | Concrete steps | Expected outcome | Result |
| --- | --- | --- | --- |
| C1 — specificity | Generate the fixture campaign from approved brand/product details; compare the three concepts. | Hero explains product value, Lifestyle provides a relevant use case, and Creative offers a distinct metaphor. Concepts use concrete input details and serve one coherent strategy. | Pending |
| C2 — distinctness | Inspect headlines, captions, and CTAs; exercise a duplicate-output fixture. | Copy is differentiated. Known repeated output is rejected without replacing the last working campaign. No automatic repair call occurs. | Pending |
| C3 — grounding | Use missing-audience/visual-rule and unsupported-claim fixtures. | Creative choices are framed as proposals; no invented offer, price, certification, audience fact, or capability is accepted as grounded information. Fixture success does not establish live semantic reliability. | Pending |
| C4 — alignment | Compare each post's concept and its matching visual instructions. | Copy and scene agree; reference-product identity is preserved in the instructions; no added advertising text is requested in images. | Pending |
| C5 — targeted regeneration | Edit an unrelated caption with distinctive text/spacing; regenerate one other field, then one card. | Only each requested target changes; unrelated edits remain exactly preserved. Existing stale-image indicators remain accurate. | Pending |
| C6 — failed regeneration | Trigger a malformed/repetitive targeted response fixture after editing a campaign. | Failure is clear; last working campaign and unrelated edits survive. No automatic paid retry or image batch starts. | Pending |

## Fidelity framework review

- [ ] Find the versioned rubric, example case manifest, report template, and zero-cost run instructions in the draft PR.
- [ ] Inspect one passing case and one deliberate identity failure. Confirm silhouette/proportions, packaging/materials, color, and logo/existing text are evaluated separately from aesthetics.
- [ ] Confirm an attractive image with a wrong/missing/duplicated product or materially changed branding/packaging fails regardless of aesthetics.
- [ ] Mark an identity dimension unassessable; confirm it yields needs-review rather than an automatic pass.
- [ ] Confirm the report records safe case IDs, rubric version, assessment limits, reviewer decision, and any disagreement without embedding private uploads or credentials.
- [ ] Confirm all examples and deterministic checks run without calling FAL/OpenAI. Explicitly record: **framework reviewed; live provider fidelity not verified**.

For a future live pilot only: founder must separately approve the exact case, model, monetary cap, and at most one paid image per run; automatic retries remain disabled. Do not use the normal campaign-generation action for a one-image pilot: the baseline flow requests three images.

## Status and decision log

Workflow: **Ready → In progress → Technical QA → Product review → Accepted**. Use **Blocked** whenever a concrete dependency, failure, or required authorization prevents progress; record reason and next owner. Accepted means explicit founder product acceptance of the recorded scope and gaps, not permission to release.

| Area | Technical result / evidence | Founder decision | Remaining gap / next owner |
| --- | --- | --- | --- |
| Brand Brain provenance and reset behavior | Pending | Pending | Builder → QA → Founder |
| Campaign quality and regeneration | Pending | Pending | Builder → QA → Founder |
| Offline fidelity evaluation framework | Pending | Pending | Framework owner → QA → Founder |
| Live brand/strategy/fidelity quality | Not verified; no paid calls | Not requested | Separate authorized evaluation |

Founder review outcome: **Pending**. Decision date: **Pending**. Reviewed commit: **Pending**. Accepted exceptions and follow-up issue URLs: **Pending**.

## Approval boundaries

| Action | Current authorization | Required next decision |
| --- | --- | --- |
| Scoped Sprint 1 implementation and GitHub product-owner workflow | Authorized per founder instruction | Product acceptance after concrete review |
| Paid FAL/OpenAI requests or live quality evaluation | Not authorized; $0 paid spend | Explicit case/run approval and monetary cap |
| Merge | Not authorized | Explicit founder merge approval after QA/product review |
| Public deployment | Not authorized | Explicit founder deployment approval and release checklist |

No credential, billing, infrastructure, or provider change is implied by acceptance. Technical QA must list actual checks run, their outcomes, and untested areas; Product review must not convert those checks into a claim of verified live AI quality.
