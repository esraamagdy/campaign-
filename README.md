# Forma — AI Campaign Studio

An e-commerce campaign generator built on the existing Next.js/TypeScript app. The four-step workflow and sage-and-cream UI are preserved. **FAL is the single AI API provider**, authenticated by one server-only `FAL_KEY`. No accounts for end users, payments, or database are required.

## Run

Use Node.js 22.3+ or 24+ (validated on Node 24) and npm:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The development app runs on port 3000. A normal production workflow is `npm run build` followed by `npm start`. The FAL migration was initially tested directly against source; the subsequent image-delivery fix also passed production build and isolated browser checks. In cloud tasks, use the existing `/workspace/campaign-` checkout; tasks are already isolated, so do not create another Git worktree unless requested. Processes must restart in new sessions.

## One provider and one key

Create a FAL API key and configure it securely in `.env.local` or the server environment:

```dotenv
AI_MODE=live
FAL_KEY=your-server-key
FAL_TEXT_MODEL=google/gemini-2.5-flash
FAL_IMAGE_MODEL=fal-ai/flux-pro/kontext
AI_TEXT_REQUESTS_PER_HOUR=40
AI_IMAGES_PER_HOUR=12
```

No separate OpenRouter, Google, image-model, or OpenAI key is required. The old `OPENAI_*` and `AI_PROVIDER` settings are no longer used. Never prefix the key with `NEXT_PUBLIC_`, commit it, or send it in chat. Restart the server after editing settings.

All inference requests go to `https://fal.run` using `Authorization: Key <FAL_KEY>`. No browser-to-provider calls or public client proxy are used. Allow `fal.run` in restricted network settings. If an image result is returned as a storage URL instead of inline data, also allow `fal.media` and `*.fal.media`. Downloads never receive the key and never follow redirects. `fal.ai` is only needed to read model/account documentation, not to make the app's inference calls.

### Selected models and estimated cost

| Task                                                   | Model/endpoint                                     | Reason                                                                           |
| ------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| Brand analysis, strategy, headlines, captions and CTAs | `openrouter/router` with `google/gemini-2.5-flash` | Affordable instruction-following model; one shared text adapter for every schema |
| Hero, Lifestyle and Creative product-reference images  | `fal-ai/flux-pro/kontext`                          | Reference-image editing and product consistency; one square PNG per request      |

Kontext Max (`fal-ai/flux-pro/kontext/max`) is an optional more expensive supported endpoint. Other image endpoints are rejected because they may use incompatible input contracts. Text model IDs can be changed with `FAL_TEXT_MODEL`, but confirm availability and JSON performance first.

**Budgeting estimates, not verified current FAL quotes:** assume Gemini 2.5 Flash at approximately **$0.30 per million input tokens and $2.50 per million output tokens**, and Kontext Pro at approximately **$0.04 per image**. A campaign using 10,000 input and 4,000 output tokens across brand/strategy calls would cost about **$0.013 for text + $0.12 for three images = $0.133**. Budget roughly **$0.13–$0.15** under those assumptions; longer documents, regeneration, routing charges, and pricing changes can increase this. `reasoning=false` suppresses reasoning in the returned answer; it does not guarantee zero billed reasoning computation. These are not spending guarantees. Verify current FAL rates and credits before any live testing.

References: [FAL OpenRouter API](https://fal.ai/models/openrouter/router/api), [Kontext Pro API](https://fal.ai/models/fal-ai/flux-pro/kontext/api), and [official FAL SDK endpoint types](https://github.com/fal-ai/fal-js/blob/main/libs/client/src/types/endpoints.ts). Direct access to the FAL documentation/pricing pages was blocked in the implementation environment; endpoint contracts were checked against the official SDK source instead. No paid requests were made, and live model availability and billing remain unverified.

### Structured JSON contract

The official `openrouter/router` input exposes `model`, `prompt`, `system_prompt`, `max_tokens`, temperature and reasoning/search options. It does **not** expose a native `response_format` or JSON-schema enforcement parameter. Forma puts the exact Zod-derived JSON schema in `system_prompt`, disables web search and reasoning output, uses temperature 0.2, and limits output to 6,000 tokens. It validates the returned `output` string with JSON parsing and the existing Zod schema. A single fenced JSON block is accepted; prose, partial responses, schema violations and empty/repetitive campaigns fail safely. No automatic paid repair/retry is performed. Provider-enforced schema guarantees are not claimed.

Brand extraction keeps the evidence layer: each field must have a supporting quote found in the actual uploaded text. Unsupported fields and invented hex codes are replaced with **“Not specified in document.”** Quote presence does not establish semantic entailment, so users still review and approve every field.

## Demo and live modes

- `AI_MODE=auto` (default): free demo without `FAL_KEY`, live with it.
- `AI_MODE=demo`: always free sample output, even with a key present; no provider request occurs. Brand output is explicitly illustrative. Images show the reference photo with a “not AI-generated” label.
- `AI_MODE=live`: requires `FAL_KEY`. Missing credentials, exhausted credits, model refusal, invalid JSON and provider failures return useful errors. No silent fallback to demo output occurs.

`/api/status` returns only mode, model names and remaining request counts. The key stays on the server. Existing UI/layout/workflow are unchanged by the FAL migration; only provider-disclosure wording and the provider-documentation link are updated.

## Workflow and data handling

1. **Brand Brain:** upload a text-based PDF, DOCX or TXT up to 5 MB. Extract actual document text, analyze up to 30,000 characters, and review/edit name, personality, positioning, audience, tone, values, messages, colors and visual guidelines, including supporting evidence. Truncation is shown. Scanned PDFs need OCR; colors present only in graphics are not inferred.
2. **Product:** add name, description, optional features, benefits and price, and a PNG/JPG/WebP product reference up to 5 MB/20 megapixels. Text strategy can run without a photo, but image generation requires one.
3. **Generate:** create three distinct Hero/Lifestyle/Creative concepts with individual headlines, captions and CTAs, then request three reference-based images sequentially. Kontext receives the original image as `image_url` (data URI), `num_images=1`, `aspect_ratio=1:1`, `output_format=png`, `enhance_prompt=false` and `sync_mode=true`. No incompatible GPT Image quality/fidelity parameters are sent.
4. **Results:** edit/regenerate individual text fields, ad concepts or visual directions, and regenerate/download each image independently. Existing images survive failed regeneration. Changed direction is marked for review. Full regeneration makes three new image requests.

Image prompts request preservation of product shape, materials, color, packaging and branding. Exact lettering, logos and geometry can still vary; review all images before advertising. Headline/caption/CTA content is rendered outside the image rather than baked into generated text overlays.

Session state is in browser memory and resets on refresh; download anything to keep. The app does not persist uploads or results. In live mode, text, approved brand/product data and reference images are sent to FAL and the downstream model providers it routes to; their data policies apply. Inline PNG results are preferred. FAL storage downloads are bounded to 18 MB, restricted to HTTPS FAL media hosts, fully decoded and normalized to PNG, and returned to the browser as data URLs. `sync_mode=true` requests inline media; it is not a general claim that FAL retains no request data.

## Usage limits

The default ceilings are **40 paid text attempts and 12 paid image attempts per Node process per hour**. Failed attempts count conservatively. Set either limit to `0` to disable that kind of paid generation. Four concurrent text and two image calls are allowed. Reservations happen before dispatch; invalid inputs and demo mode do not make inference calls. Partial text regeneration requests only the selected field/object.

Text/image calls time out after 60/180 seconds; image routes permit up to 240 seconds, subject to hosting limits. No automatic retries or queues that could create duplicate charges are used. A timeout does not establish that the provider stopped computing or billing.

Limits are in memory, reset on restart, and independent across workers/replicas. They are not monetary caps. Use FAL credit/budget controls too. Before public multi-instance use, add shared limits, authentication or abuse protection, and parser isolation. No public deployment is included.

## Architecture

- Existing `app/page.tsx` and components retain brand approval, product preview, paired ad cards, editing, downloads and image state.
- `app/api/brand`, `campaign`, `images`, `status`: existing server routes and contracts.
- `lib/ai.ts`: server-only orchestration and usage reservations. `lib/providers/fal.ts`: text/image provider interfaces, direct FAL requests, safe errors and bounded image downloads. `lib/providers/config.ts`: single-key model/mode configuration. No direct OpenAI integration remains.
- `lib/schemas.ts`, `brand.ts`, `campaign.ts`, `prompts.ts`: preserved schemas, evidence checks, safe targeted merges and product-preservation instructions.
- `lib/usage.ts`, `uploads.ts`, `http.ts`, `api-error.ts`: request/concurrency budgets, server image decoding, streamed body caps and useful safe errors. Inputs are treated as untrusted reference data.

## Tests without paid calls or a rebuild

```sh
npm test
npm run lint
npm run typecheck
```

`npm test` covers schemas, document grounding, merge isolation, streamed body limits, actual FAL request shapes/authentication, original reference bytes, invalid/fenced/partial JSON, safe errors, trusted storage downloads, budgets, and current brand/campaign/image/status route handlers. Provider fetches are mocked. Route tests execute the changed TypeScript source directly with a dummy key and a test-only interceptor that refuses external network access. Demo tests assert no provider call occurs. These tests require no compiled `.next` build and make no paid requests.

Browser suites remain available for a later rebuilt app:

```sh
npm run test:e2e
npm run test:e2e:live
```

They need a current production build, Chromium at `/usr/bin/chromium` or `CHROMIUM_PATH`, and available ports 3100/3101. The mocked live suite uses `tests/fal-preload.mjs`, never imported by the application. Browser suites were not rerun against a stale build during this migration. No claim is made about paid FAL connectivity, output originality, product fidelity, account access or current pricing until real testing is authorized and configured.

## Image-delivery investigation and free verification

FAL's **Completed** status confirms inference, not successful delivery/decoding in the browser. With `sync_mode=true`, the endpoint requests inline data instead of a hosted preview. A dashboard preview marked “Not available” alone is not evidence of inference failure, and an inline result may not be recoverable from dashboard history. Do not regenerate just to diagnose this.

The previous parser rejected any data URI that did not begin exactly `data:image/png;base64,`, even if its bytes were a valid image. It also checked only the PNG signature, letting corrupt files reach the browser. Separately, React accepted malformed successful API responses without checking the image contract, and the image component had no browser-decode error handler. Those silent paths are now rejected or displayed in the existing error area. These defects are reproduced by tests; the exact original live response subtype cannot be identified without its HTTP response or diagnostic metadata, which was not available during this investigation.

The decoder now handles direct FAL and SDK-wrapped image payloads, inline base64 with generic/unspecified MIME labels or MIME parameters, and hosted HTTPS `fal.media` subdomains. Actual PNG/JPEG/WebP bytes are fully decoded with size/pixel limits and returned as normalized PNG data URLs. SVG/HTML, corrupt bytes, malformed base64 and untrusted hosts are rejected. Hosted downloads remain bounded, carry no FAL key, and do not follow redirects. `sync_mode=true` is preserved; no fallback paid request is made.

`/api/images` assigns an `X-Forma-Request-Id` to every response. Successful image objects include that ID; failed requests show it beneath the card. Server `[forma:image]` records correlate the route, FAL HTTP status/request ID, inline/hosted source, declared MIME category, decoded format/dimensions/byte counts and failure code. No prompts, reference images, generated base64, media URLs/query tokens, credentials, raw provider bodies or exception objects are logged. Browser decode failures log only the card index, safe code and request reference, and are visible in the existing card error area. Previous successful images remain available after failed requests.

Verify without credits or real generation:

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
npm run test:e2e:live
npm run preview:fixtures
```

The fixture preview starts the built app privately on loopback port **3102** with a dummy key and a test-only interceptor. On your computer, open that local port; in Codespaces, use private port forwarding. Upload `e2e/fixtures/brand.docx` (or any test document), use a test product and `e2e/fixtures/product.png`, then run through the normal workflow. Button actions return existing fixture images only—no inference is performed. Hero exercises generic-MIME inline PNG, Lifestyle inline JPEG, and Creative a mocked hosted FAL image. All three should display and download. This confirms delivery and rendering, not actual model quality. Stop this fixture server before running the real app; normal `npm start` does not load the interceptor.

Automated browser suites use isolated ports **3100/3101**, never attach to an existing server, and override real credentials/mode with demo or mocked settings. Tests assert `complete && naturalWidth > 0`, not just visible `<img>` elements. They also verify that malformed 200 responses and browser decode failures produce visible errors without automatic generation retries. No live FAL inference or retrieval of private historical results is part of these checks.
