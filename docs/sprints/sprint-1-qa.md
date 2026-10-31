# Sprint 1 technical QA and known gaps

Decision: **Scoped offline implementation checks pass; Founder acceptance pending.** Private remote preview delivery is blocked separately. No merge, public deployment, or paid model call occurred. Provider API cost: **$0**.

Baseline: `357df33a60a542693e4164a6d211e9031d414520`. Candidate: implementation commit `ddd05dce81a2df647a21848f4c252662a13b42e3` in [Draft PR #9](https://github.com/esraamagdy/campaign-/pull/9). Product, Architect, Builder and QA used native Codex subagents; one writer owned each file. QA independently inspected the integrated changes and ran targeted brand, campaign and evaluator tests.

## Changes reviewed

- Brand extraction accepts conservative phrases located inside a matching quote. Every located extraction still needs human support review; there is no semantic verification claim. Edits remove current document attribution, clearing preserves missing information, restoration uses the original snapshot, and a new successful upload resets review.
- The UI requires current-draft approval before generation. Failed replacement retains the previous draft with its original file identity and a recovery action.
- Strategy instructions separate supplied facts from proposals, treat input as untrusted data, and align the three post/visual pairs. Demo output reflects those pairs. Existing duplicate checks and exact non-target regeneration preservation remain.
- The offline fidelity evaluator validates bounded scorecards and reports pass/fail/needs-review. Identity failures cannot be averaged away by aesthetics; inapplicable and unassessable dimensions are distinct.

## Actual checks

`npm run quality` completed successfully in the managed workspace with demo defaults, no real FAL key, and network-enabled sandbox permission for local build/browser processes.

| Check | Result |
| --- | --- |
| Unit and isolated integration tests | 43 passed: core 4, providers 15, routes 3, image handling 10, brand quality 4, campaign quality 2, evaluation 4, fixture producer/consumer regression 1 |
| ESLint | Passed |
| TypeScript | Passed |
| Production build (`next build --webpack`) | Passed |
| Demo browser suite | 12 passed, including 2 new provenance/replacement tests and mobile layout checks |
| Mocked-live browser integration | 1 passed; provider calls intercepted, not real AI verification |
| Diff whitespace checks | Passed |

Independent QA found a brand-grid layout regression after the markup change. Builder repaired the field selector and label layout; the integrated browser checks passed afterward. Running fixture preview additionally passed browser smoke checks for all three exact synthetic documents. A fixture-preview smoke check also found a newline-marker mismatch in the test preload; it was corrected and exact corpus response tests were added before handoff.

## Authored calibration outcomes

| Case | Identity / aesthetics | Outcome |
| --- | --- | --- |
| plain-cup | Applicable identity dimensions 4, aesthetics 3 | Pass for the authored scorecard |
| labeled-box | Label text 2 and blocking spelling defect, aesthetics 5 | Fail despite aesthetics |
| distinct-bottle | Label text unassessable; other dimensions 4 | Needs review |

These records contain authored scores, not actual model-generated images or automated pixel judgments. See [rubric](../evaluations/sprint-1/rubric.md), [manifest](../evaluations/sprint-1/manifest.json), and [report template](../evaluations/sprint-1/report-template.md).

## Explicit limits

- Real Gemini extraction, campaign creativity, and Kontext product fidelity were not tested. There is no measured semantic accuracy, recall, or model-quality improvement claim.
- Lexical matching cannot resolve arbitrary negation, conflicting passages, or prompt injection. A phrase that occurs in the document can still be inappropriate as a fact. The UI requires review and the prompt is conservative; this is not a complete semantic defense.
- The three annotated documents are a small manual benchmark, not statistical evidence. Human two-reviewer semantic scoring and any real-provider baseline/candidate comparison remain pending.
- Browser state remains ephemeral. Approval is client workflow state, not an authenticated server attestation or durable audit record.
- No authenticated remote preview URL is available from this session. Local fixture execution is working; [private-preview handoff](sprint-1-private-preview.md) remains open in issue #8.

Rollback: revert the scoped Sprint1 commits to the pinned baseline. No schema migration, persisted customer data, provider change, or production release is involved.
