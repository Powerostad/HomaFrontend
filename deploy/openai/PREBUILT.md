# Off-server frontend builds

## Retired intake history and authored provenance — 2026-10-16

Source `b980e45fe4df59601ded985b4f9c259daa51a49b` filters the exact retired
automatic first-photo message during hydration and sends `text_origin=user`
only with authored text. Backend `85345d4` also sanitizes read/context/retry
paths and uses the unchanged mother source with minimal native transport.
56 frontend tests and TypeScript passed; backend offline regression suites passed.
Local entry `/assets/index-DOQnvX1H.js`, SHA256
`71eb254cd691ffea57a7715c2e0e482e2f9e909ebfb7474c02d1fe655b4d22de`.
Archive SHA256 `5f9292614f7eb00bf04a0dd4545cd633fba475b63588483f13f2f2290f6c8169`.
Activate `prebuilt-b980e45` only after verified image transfer. Previous
`prebuilt-66671cb` is retained and pinned for frontend rollback. No VPS build,
paid model call, original-site or ERP changes. Raw historical audits remain.

## User-authored request boundary — 2026-10-15

Source revision `66671cbc86b772ebd1e70bf0523dd92da78a59d3` removes invented
intake/product-preview user prose. Empty user text is omitted from the command;
explicit selections remain structured preferences. Requires backend `4839289`.
54 frontend tests, 320 offline backend tests and TypeScript passed. No paid AI run.
Locally built entry `/assets/index-Dd6Edmga.js`, SHA256
`3484d1f44d7de3d8935477621700323c481977981dffcb8b0be9a3ce7088523e`.
Dist archive SHA256 `464d5cc01be580234194b130f376c5879167c42785b5080e642c94e501e122e3`.
Immutable image `homa_openai_frontend:prebuilt-66671cb`; register and verify the
image before deploying. Previous `prebuilt-3360d39` is pinned for rollback.
Historical messages are not rewritten. Mother/system prompts are unchanged.

## Studio Performance Lab tab — 2026-10-15

Source revision `3360d39b765384efac068efa1d459e89ff8a46d3` adds the bottom-of-Studio
owner performance tab. Locally compiled and transferred with strict SSH host-key
verification; no compilation on VPS. Runtime tag `homa_openai_frontend:prebuilt-3360d39`
was registered before this manifest change. Image ID:
`sha256:937792b896a972fbff35cf12df334e5c234211e25730e3fa3f76f854298b9f90`.
Dist archive SHA256: `5baba5d45465ccc130bccca383e3857b9a13218bea1b22e1c9fbd6efba8ec8c3`.
Entry `/assets/index-Sj-KdTvb.js`, SHA256
`943a1c787ec97db7e087bf2d95b3b3b9416b9ef787a9bedee520a335aaaa5d21`.
Previous `prebuilt-42ac4d4` is retained for rollback and old assets remain in the
new image. Requires backend owner-scoped `/performance/` endpoint (fbca415).
Historical uncorrelated runs show unavailable rather than fabricated data.

The 8 GiB VPS experienced a confirmed global OOM during a frontend deployment.
Dokploy restarted and cancelled the interrupted deployment on startup. Do not
build this frontend there while memory headroom is exhausted.

For release 67a902d, build the existing Dockerfile on a Linux-amd64 capable local
Docker engine, tag `homa_openai_frontend:prebuilt-67a902d`, and label
`org.opencontainers.image.revision=67a902dad048ecf2e6d67b5ef42c29b4ae1c8811`.
Save the image, record archive SHA256 and image ID, transfer over host-key-verified
SSH and load it on the VPS. No API keys or local environment files belong in the
image or archive. The source .dockerignore excludes local environment files.

Only after verifying the image ID on the VPS, change the isolated
OpenAI-Frontend Compose path to `./deploy/openai/docker-compose.prebuilt.yml`.
Keep source branch `codex/isolated-development`, autoDeploy false, existing domain,
environment and volumes. The file has no build section and pull_policy never:
even Dokploy's normal `up --build` cannot compile or pull this service.

For future releases repeat with a new immutable tag and update this manifest.
For domain moves update the runtime VITE_API_BASE_URL/private media origin and
Dokploy domain separately; public catalog media stays on its configured origin.

Rollback: preserve previous image and its deployment configuration. Restore
the prior image using a no-build manifest; do not rerun the old source-building
manifest on the memory-constrained VPS. Confirm health before reporting success.
No database or provider changes are needed. Never restart ERP or original Homa
services for this isolated frontend rollout.

## Offline registry fallback (2026-10-13)

Local Docker/Arvan pulls timed out. The equivalent low-memory route is to run
`npm run build` locally with explicit isolated-site public VITE values, package
only dist files, and record their SHA256. Transfer this archive over verified SSH.
Use the existing previous runtime image `homa_openai_frontend:c468e5e` as base:
create a unique stopped, network-none helper container, docker cp the compiled
dist archive into its html directory, then docker commit with source revision
and archive checksum labels. Remove only that helper container. No npm, tsc,
Vite, source compilation or running service restart occurs in this preparation.
The existing nginx, runtime configuration entrypoint and crawler sidecar remain.
Keep old assets so already-open tabs can load them. Archive paths are checked
for traversal, links and environment files before upload. Deploy the same
prebuilt manifest only after the helper reports the new image registered.

## Latency/media release — 2026-10-14

Code revision `42ac4d4cfd28276ac2d48ea6ab292218d176e4fa` fixes lazy product
image loading. Immutable tag: `homa_openai_frontend:prebuilt-42ac4d4`.
Build locally with explicit isolated public VITE values; package only compiled
dist files with `tools/package-prebuilt-frontend-42ac4d4.py`. Its manifest records
the bundle entry and archive SHA256. `tools/transfer-prebuilt-frontend.py` uses
strict known-host verification and a user-entered SSH password (not stored).

The stopped helper now starts from the currently deployed
`homa_openai_frontend:prebuilt-67a902d`, retaining its old assets for open tabs.
The previous image is also pinned in `docker-compose.rollback.yml`. Keep the
same isolated resource, compose path, runtime environment, domains and volumes.
Do not deploy until the checksum/revision/image-ID verification reports loaded.
