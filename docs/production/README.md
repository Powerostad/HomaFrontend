# Production frontend â€” myhoma.ir

Verified on **2026-11-10**. The running image is `homa_openai_frontend:category-sections-20261107`; its exact image ID and per-file hashes are in [source-manifest.json](source-manifest.json).

## What is where

| Location | Purpose |
| --- | --- |
| `src/` | Editable React source recovered from the deployment checkpoint |
| `src/pages/Studio/` | Intake, progress, result, conversation and room options |
| `src/services/` | Existing API clients and session integration |
| `src/pages/Explore/PublicShowcase.tsx` | Current public category-based product showcase |
| `src/blog/`, `blog-http.mjs` | Database-backed blog rendering and HTTP adapter |
| `production/artifact/html/` | Exact 140-file dated deployment build; generated, not editable source |
| `production/runtime/` | Captured running Nginx/public configuration and server adapters |
| `docs/history/` | Historical refs, pending work and previous README |

## Verification result

The recovered React source was built locally with the public production flags listed in the manifest. **All 140 files in the dated deployment artifact matched byte for byte**, including JS, CSS, the service worker and static public documents. An additional `config.js` is expected: production generates this public configuration at container startup and excluded it from its original build tar.

Keep `production/artifact/` and `production/runtime/` ignored by Tailwind source discovery (they are explicitly versioned as evidence). Otherwise class names found in generated bundles pollute the rebuilt CSS. They are also marked generated in `.gitattributes` to keep source searches focused.

Runtime adapters were checked against the running container. The large blog renderer exceeded the read API limit, so its full bundle is from the inherited deployment context with a live 512KiB prefix check. This limitation is recorded rather than claiming an unperformed full live hash comparison.

## Commands

`npm ci`, `npm run type-check`, `npm test`, `npm run build` retain the existing app conventions. After a build run `node scripts/verify-production-reference.mjs --rebuild`; this checks the exact artifact contract. Run without `--rebuild` for the committed artifact/runtime integrity check. The CI gate validates the real build/evidence paths; it does not pass by removing the old SEO check without a replacement.

Blog articles may be read from content branches into the database by the existing 48-hour sync. Do not delete those branches just because their PR is open. Unpublished code PRs are separate and must not be described as already deployed.

This organization does not deploy code, alter authentication, change recommendations, upload a catalogue or change blog scheduling. See the [backend production flow map](https://github.com/Powerostad/HomaBackend/tree/codex/production-server-20261110/docs/production) and [historical refs](../history/README.md).

### Inherited build-input quirk
The deployed build also scanned the generated server bundles in `dist-blog-server/` during Tailwind discovery. The recovered/generated seeds are retained and marked generated so a clean checkout reproduces the same CSS. Removing or ignoring those seeds changes five unused utility declarations and all downstream content hashes. This existing quirk is recorded here rather than changing application/build behavior during repository organization.
