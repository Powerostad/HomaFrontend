# Compact product cards — 2026-10-18

Target: OpenAI-Frontend `lV8z1EMrI0jxZMpggrMQa` only.

Before release, server was running deployment `LBEm9ylYkME9RcP4PS6DH`, source
`c5e4047f8919e0bb7095e08870c906b82efb564c`, runtime image
`homa_openai_frontend:prebuilt-50beafb` (ID
`sha256:ddb50565efb812667ea41562eb50bc70c09d925613ba9b0f49b4ce8eb7c6c7a2`).
The image and previous assets must be retained.

To restore the exact prior UI without compiling on the server, set this compose's
path to `./deploy/openai/docker-compose.rollback.yml` and deploy it. Verify
healthy status and public entry `/assets/index-B38E5HYt.js`. The rollback file
pins `prebuilt-50beafb`; no database migration or backend deployment is needed.
To return to the compact product release, restore compose path to
`./deploy/openai/docker-compose.prebuilt.yml` and deploy.

The source before this release is also preserved by Git at `c5e4047`.
The unrelated local sitemap modification is excluded from the release commit.
