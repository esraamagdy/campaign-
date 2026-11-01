# Sprint 1 private preview

**Access status: blocked for remote Founder access.** The app runs and has passed browser tests on private loopback in the agent workspace. This session has no authenticated port-forwarding/share endpoint. `http://127.0.0.1:3102` refers to that workspace, not the Founder's computer; it is not a remotely usable review link. No public deployment or tunnel was created.

Tracking and next owner: [handoff issue #8](https://github.com/esraamagdy/campaign-/issues/8), Orchestrator/Release. To complete remote product testing, connect an existing authenticated private preview runtime or an owner-controlled private Codespace. Release must verify owner access and denial to unauthenticated visitors before marking preview delivery complete. Do not post private preview bearer URLs in this public repository.

## Reproduce in an existing private workspace

Use branch `feat/sprint1-ai-quality-brand-intelligence`. These commands require Node 22+ and the repository dependencies. No real API credentials are needed.

```sh
npm ci
AI_MODE=demo FAL_KEY='' FORMA_LIVE_TESTS=0 npm run build -- --webpack
npm run preview:fixtures
```

The fixture runner binds only `127.0.0.1:3102`. It uses a test-only placeholder key and a preload that intercepts FAL requests, returns authored responses, and rejects other external fetches. It does not contact the real provider. Keep port 3102 **Private** in any workspace port-forwarding UI; do not make it public. For a local workspace, open `http://127.0.0.1:3102` on the same computer.

## Founder walkthrough

1. Upload [the comprehensive synthetic brand document](../../tests/fixtures/quality/brand-rich.txt). Analyze it and inspect a source quote. The value remains a document extraction requiring review, not a verified semantic fact.
2. Edit tone; its old evidence disappears and the label becomes user supplied. Restore the extracted value if desired. Clear colors to see the missing state. Approve the current draft to continue.
3. Add a sample product name and description. Use [the synthetic product image](../../e2e/fixtures/product.png). Continue and generate. Text and images are authored fixture results, not new AI output.
4. Edit one caption and regenerate another headline. Confirm the unrelated edit remains unchanged.
5. Return to Brand Brain. Upload [the sparse document](../../tests/fixtures/quality/brand-sparse.txt), then [the conflicting document](../../tests/fixtures/quality/brand-conflicting.txt). Each successful analysis replaces prior provenance; missing facts and conflicting tone remain unspecified in these authored examples.
6. To test replacement failure, upload a TXT file containing fewer than 20 readable characters. The previous draft remains visibly tied to the previous file. Choose **Keep previous analysis** to recover, then reapprove.
7. Complete [the Product Review Checklist](sprint-1-product-review.md). Automated malformed-output scenarios are covered in browser tests; the fixture server does not expose interactive controls for every failure case.

Arbitrary uploads do not receive genuine model analysis in this preview. Only the three exact synthetic corpus documents and the original Cinder test example have authored responses. Sample images are the same reference fixture across concepts. Do not evaluate live creative quality or product fidelity from this preview.

Future real-provider testing requires a separately approved case and numerical budget. The ordinary campaign action requests three images; it must not be used for a one-image pilot.
