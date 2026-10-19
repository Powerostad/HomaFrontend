# Balanced Studio rules

The independent `studio-rules-v2` profile scopes missing evidence or execution
ambiguity to affected actions, and treats missing explanatory prose as a design
note. It does not loosen SKU/stock/provenance or checkout eligibility.

Set `VITE_STUDIO_PIPELINE_V5=true` and `VITE_STUDIO_RULES_V2=true` for NEW sessions.
Creation sends `rules_version: studio-rules-v2`. With the rule flag disabled, the
request retains its previous form and strict policy. Existing sessions keep their
saved profile. Do not silently migrate the user's previous failed conversation.

The result review panel shows action holds separately from design notes. It adds
no automatic retry button or model call. Structural repairs remain auditable in
the canonical document; verbose diagnostic data is not exposed as shopping copy.

Backend/frontend branches `codex/studio-pipeline-v5` preserve the previous version;
this implementation is on `codex/studio-rules-v2`. The full V6 workflow architecture
proposal is separate. Local workers remain stopped until the user requests testing.
