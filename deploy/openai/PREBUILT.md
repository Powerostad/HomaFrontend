# Off-server frontend builds

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
