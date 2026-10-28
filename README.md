# Forma — AI Campaign Studio

A functional e-commerce campaign generator built with Next.js App Router, TypeScript, Tailwind CSS v4, and Lucide icons. No accounts, payments, database, or external storage are required.

## Run locally

Requirements: Node.js 22.3+ or 24+ (validated on Node 24) and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the development server on port 3000. For production: `npm run build` followed by `npm start`.

The API works without credentials: **demo mode is explicitly labeled** in the brand review and campaign results. Demo analysis is illustrative and does not infer facts from the uploaded text; edit it to match your brand. Demo generation interpolates the approved brand and product into sample campaigns, with a fixed alternate version for regeneration.

To enable live AI, set these **server-only** variables in `.env.local` or your hosting environment and restart the server:

```dotenv
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-4o-mini
```

Never prefix credentials with `NEXT_PUBLIC_` or commit `.env.local`. Server network access to `api.openai.com` is required. No live-provider call was validated without credentials. A configured but failing provider returns an error; it never silently switches to demo mode.

## Workflow

1. **Brand Brain:** upload a text-based PDF, DOCX, or TXT (maximum 5 MB). Review and edit positioning, audience, tone, values, key messages, and visual identity, then approve.
2. **Product:** upload an optional JPG, PNG, or WebP (maximum 5 MB), add a name and description, and optionally specify features, benefits, and price. The image is previewed locally.
3. **Generate:** review the brand and product summary and generate the campaign.
4. **Results:** edit the campaign name, big idea, objective, audience, message, three social concepts with captions/CTAs, and three visual concepts with image prompts. Copy individual cards or the complete campaign as JSON. Regenerate one card while preserving all other edits, or regenerate the full campaign.

Uploads and edits live in memory and are lost on refresh. Product images stay in the browser and are **not analyzed by AI** in V1. Visual output consists of concepts and prompts, not generated images. Scanned PDFs need OCR before upload. Document extraction requires at least 20 readable characters; only the first 30,000 text characters are sent for AI analysis. This keeps the MVP lightweight and limits context size.

## Architecture and decisions

- `app/page.tsx` coordinates the four-step client workflow and session state. Accessible labeled inputs, keyboard-operable upload controls, error states, loading states, and responsive layouts support desktop and mobile use.
- `components/StepProgress.tsx` handles gated progress navigation; `components/CampaignResults.tsx` renders editable strategy, post, and visual cards.
- `app/api/brand/route.ts` validates and extracts document text using `pdf-parse` and `mammoth`, then returns a structured brand analysis. DOCX is extracted as raw text rather than rendering embedded HTML.
- `app/api/campaign/route.ts` validates approved brand/product data and optional regeneration targets, generates a structured campaign, and merges only the requested element.
- `lib/schemas.ts` is the shared Zod contract for request validation, structured AI responses, and TypeScript types. Output requires exactly three posts and three visual directions.
- `lib/ai.ts` is marked `server-only`. It calls OpenAI with JSON output, validates responses, uses a 60-second timeout, and keeps keys out of browser bundles. Uploaded text is treated as reference data rather than instructions.
- `lib/mock.ts` provides clearly identified sample output. `lib/campaign.ts` isolates the nonmutating regeneration merge. `lib/http.ts` bounds actual streamed request bodies, including requests without Content-Length.
- `app/globals.css` uses Tailwind's build pipeline and shared CSS tokens for the sage-and-cream studio interface. No external fonts or asset services are needed.

Client validation gives immediate feedback. Server validation checks document extension, MIME type, size, PDF/ZIP signatures, parser results, required fields, field lengths, and valid regeneration targets. Image validation checks type, size, and browser decoding; images never reach the server.

This is an unauthenticated MVP intended for local development or controlled testing. Before exposing a paid AI endpoint publicly, add deployment-level rate limiting, request budgets, robust abuse protection, and parser isolation. No application persistence or server-side document storage is included; live mode sends extracted document text and approved product/brand data to OpenAI, whose own data policies apply. Copy is the export mechanism.

## Validation

```sh
npm test              # schema, output completeness, targeted merge, body limit
npm run lint          # Next.js + TypeScript ESLint
npm run typecheck     # TypeScript
npm run build         # production compilation and route generation
npm run test:e2e      # run after build; starts the production app on port 3000
```

Validated: four unit tests, four browser/API tests, ESLint, TypeScript, and the production build. Real TXT, PDF, and DOCX inputs and clipboard export are covered.

Browser tests use the system Chromium at `/usr/bin/chromium`. On another machine set `CHROMIUM_PATH` to your Chromium executable. Tests exercise the demo flow; run with `OPENAI_API_KEY` unset. The browser suite covers document analysis, brand edits, product details/image preview, campaign generation, preserving edits during regeneration, mobile overflow, invalid uploads, and API error responses. A production build must exist before browser tests start.

## Cloud environment

Use the existing `/workspace/campaign-` checkout; each task already has an isolated environment, so no extra Git worktree is needed. Install with `npm ci`, then use `npm run dev` for development or `npm start` after a build. Processes must be restarted in new sessions. npm registry access is needed to reinstall dependencies; `api.openai.com` is only needed for live AI.
