# Validation â€” production source organization (2026-11-10)

- No application deployment, database change or paid model request was performed.
- Recovered frontend build checkpoint: all 140 files matched the dated deployed artifact byte for byte before documentation organization. The final organized checkout is checked again with `verify-production-reference.mjs --rebuild`.
- Frontend type-check/build passed. Existing Vitest baseline: 334 tests passed, 3 failed; 72 files passed, 3 failed. Failures concern localization coverage/static Persian copy, not a newly implemented UI change. Full lint reports 6 pre-existing unused eslint-disable directives in CataloguePage and comparison pages. These are recorded rather than changing the published UI during source organization.
- Backend captured-source manifest and Python parsing passed. Service-specific source differences are recorded and hashed. The optional full Django test environment requires a local writable logs directory; no production credentials were imported.
- Repository access permits pushes/PRs but not administrator settings. Repository read-only archival/default-branch settings are not claimed to have changed.
- The live apps use raw Docker image deployments with `autoDeploy=false`; Git ref organization does not publish an application image.

Backend legacy split regression subset: 24 passed, 14 failed against the captured runtime baseline (old output/fixture expectations). These are not presented as passing, and this organizational snapshot does not change runtime logic to satisfy them. The complete verification/pytest outputs are retained in the private local organization archive.

The production reference is isolated on `codex/production-server-20261110`; default `dev` is not silently assumed to be deployed. A README/agent notice points readers to the verified source before making code changes.
