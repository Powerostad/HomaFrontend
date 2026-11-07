# Homa production contract: nginx-public-documents-blog-v1

## Authoritative execution path

The deployable frontend is built by the root Dockerfile. `npm ci` installs the
lockfile; `npm run build` generates the public sitemap, type-checks, builds Vite,
renders the static marketing/information pages, bundles the blog renderer and
records provenance. Nginx serves static assets and proxies document routes to
`render-bot.mjs`. Despite its historical filename, this process handles both human
and crawler requests, using `public-documents.mjs` and `blog-http.mjs`.

`server.mjs` and `src/seo/entry-server` are legacy reference code, NOT this release's
entry point. They are not imported by the release gate. The previous gate is
archived in the dated release record; its checks are replaced by actual runtime
HTTP checks rather than simply removed.

## Historical production inventory (verified 7 November 2026)

| Component | Immutable runtime/source boundary |
| --- | --- |
| Frontend | `homa_openai_frontend:category-sections-20261107`, image `sha256:14cfdf376476b3b8818078f98fef6c08399f1079d7dfe15fb4c0ad7f45720091` |
| Backend web/API | `homa_openai_backend:category-sections-20261107`, image `sha256:762d98ab27ea943a47b02748ac3c38a7f44dc0919c89ddeb4dcea23df9bdb88a` |
| Blog sync | `homa_openai_backend:blog-topics-20261106`, image `sha256:4c9d939f77e74f0486b722735873b683ab7366ac7112046213a369e46dcf0725` |
| Chat/job workers | `homa_openai_backend:blog-github-sync-20261106`, image `sha256:3091a9128a25ebdd2ac72c560fda47a227cafabb11396ebddd40129d6f56aeaa` |
| Article content | `Post.source_reference`: repository, branch, path, commit, blob, modified time, body hash and asset identities; not the frontend image revision |
| Catalogue | PostgreSQL; not Git or the frontend bundle; no database migration is part of this work |

The historical images were assembled through dated local overlay releases, not
from GitHub `dev`. Their original single Git commit is UNKNOWN; do not invent one.
The source checkpoint reconstructed here uses the pre-editor archive
`HOMA-ARCH-20261107-STUDIO-LEGACY-ROUTES-v1` and unchanged public artwork. The exact
historical dist artifact and manifest remain in the private dated release record.
Reconstruction is not a claim of byte-for-byte identity with that old image.
Pending local prompt-editor/two-route changes are deliberately excluded.

## Source, build and release identity going forward

Non-secret compile-time flags are tracked in `config/build.production.json`;
machine-local env files are not build dependencies. Runtime API/auth/analytics
configuration remains runtime configuration, not a credential baked into Git.
Build with `docker build --build-arg SOURCE_REV=$(git rev-parse HEAD) -t <tag> .`.
The image carries the revision in an OCI label and `/build-info.json` exposes only
the revision, release contract and source checksum. A detailed hash manifest is a
CI artifact, not public application metadata. Secret env values are never copied.

Each CI run builds ONE deployable Nginx image and tests that SAME image before
preserving its Docker archive and HTTP report under the commit SHA. Deploy that
artifact by image digest; never silently rebuild a different working tree.
The public metadata revision must equal the image's OCI revision label.

## Tests

`npm test`: Vitest application tests AND explicit Node route-contract tests.
`npm run lint`: existing zero-warning lint gate.
`npm run build`: the real production output, not an unused SSR layout.
`npm run test:release`: actual router + actual built blog renderer, with local data.
`node scripts/seo-http-check.mjs --image <tag>`: Nginx, startup scripts, router and
blog renderer inside the actual image. Test data is served by an isolated fixture;
no request goes to production APIs or paid AI services.

The HTTP gate checks genuine page text, H1, canonical and article schemas; identical
HTML for human and Googlebot user agents; 200 public documents, 404 missing
documents, noindex private Studio/session pages, real robots/sitemaps and blocked
public merchant URLs. `/explore` remains the existing client gallery; improving
its initial SEO document is a separate product change, not falsely claimed here.

## Deployment and rollback

This branch is for review. No production app, model, prompt, catalogue, database
or blog synchronization schedule is changed by CI. Publication requires local
validation of the exact image, a dated capture of current image IDs/configuration,
and deployment of the requested component only. Keep known-good image archives.
After activation compare the running digest and `/build-info.json` with the CI
report, then test real public/404/noindex documents with both user agents. Blog
content identity must be audited separately through its stored source_reference.
