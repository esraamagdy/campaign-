# Forma — Prioritized Agent Backlog

Status: **Proposed, not approved for implementation**. Product Owner chooses scope before agents code.

## Sprint 0 — Stabilize a safe baseline (P0)
- Inventory current MVP and smoke-test private fixture mode; document reliable local/Codespaces setup.
- Verify repo visibility, credential isolation, scoped budgets, private preview ports.
- Record baseline screenshot and known gaps (live model fidelity not established, browser state ephemeral).
- Acceptance: existing tests/build pass; no new paid calls; no deployment; reproducible fixture preview.

## Sprint 1 — Brand Intelligence & Fidelity (P0)
**1A: Brand Brain evidence and editing**
- Upload a representative brand document; distinguish sourced brand facts from suggested creative directions.
- Add a review screen for missing fields and evidence; maintain source grounding.
- Metrics: factual accuracy and unsupported-claim rate across 3 test documents.

**1B: Product identity preservation evaluation**
- Define an evaluation rubric for silhouette, packaging, color, logo/text, overall aesthetics (1–5 scale).
- Create an explicitly approved, low-cost reference-image test with 1 paid image maximum per test run.
- Capture failures without exposing user images; compare models only after cost approval.
- Metrics: product fidelity and generated-image usability, not just success rate.

## Sprint 2 — Brief & Creative Controls (P1)
- Campaign objective, audience, channel, tone/style, preferred size, constraints; validate before generation.
- Individual concept/image regeneration with estimated costs and explicit confirmation.
- Acceptance: each choice changes the intended strategy and prompts, with non-regression tests.

## Sprint 3 — Persistent Brand Workspace (P1; dependency: architecture/security approval)
- Authentication, brand/product asset storage, history and deletion/export.
- Data ownership, storage retention and tenant isolation must be designed before code.
- Acceptance: reload persistence, access controls, no exposed assets/secrets, tests.

## Sprint 4 — Monetization & Observability (P2)
- Per-organization usage metering and actual per-provider cost logging (no key or image payload).
- Credits/plans, quotas, billing, analytics—only after pricing validation and security review.

## Sprint 5 — Integrations (P2)
- Shopify/Salla/Zid product imports and exports, with scoped permissions.
- Bulk creation, queued execution, idempotency, retries, governance and cost controls.

## Immediate founder decision
Pick **Sprint 0** first, or choose one bounded story from Sprint 1. The Orchestrator should produce a short plan, not begin implementation without approval.
