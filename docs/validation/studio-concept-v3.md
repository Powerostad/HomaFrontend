# Studio concept-first rules V3

Local-only session opt-in, following the user's request to keep the original
design freedom while improving diagnosis and product matching.

Enable `VITE_STUDIO_PIPELINE_V5=true` and `VITE_STUDIO_RULES_V3=true`. New
conversations send `rules_version: studio-rules-v3`; the V3 flag takes precedence
over the V2 flag. Existing conversations retain their saved rule profile.
Disabling V3 restores the previous flag selection. The preserved
`codex/studio-rules-v2` and `codex/studio-pipeline-v5` branches remain available.

The backend adds `visualization.purchase_independent=true` to concept execution
views. The review panel describes missing information as a purchase concern;
it does not label the whole design as needing revision just because no SKU or
measurement is available. Explicit design conflicts remain separately visible.

Unverified candidates and merchant links are inside collapsed details. The
mislabelled global review button, which re-searched the first purchase line,
has been removed; each product retains its scoped verification/search action.
No UI effect automatically retries a model call or search.

Backend ADR0051 documents the server revision comparison, readiness separation,
concept rendering, review reuse and retained purchase checks. The full mother
policy is preserved. No server deployment, paid generation or automatic migration
of saved conversations is part of this change. Local model workers remain stopped.

Validation: TypeScript and ESLint pass. 28 focused tests in five files pass,
including session flags, separation of purchase/design messages, collapsed
candidate links, existing page behavior and product presentation adapters.
