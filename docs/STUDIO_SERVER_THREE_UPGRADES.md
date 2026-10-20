# Server UI with taxonomy, product search and split prompts

The server discovery, result, history, render/recovery and expense interfaces
remain. Product/variant identities, source guidance and fresh basket checks are
the retained search extensions. Session creation now sends
`prompt_split: server-split-v1`, not a design V2 or V3/V4/V5 pipeline release.

The backend rebuild starts from server source and has no V2 design engine or
review/action graph. No new review/progress/cost interface is introduced here.
Local runtime keeps the search/taxonomy flags and drops retired pipeline flags.

Rollback: `codex/studio-server-design-search-only-v1` at `49d1056`.
Validation: 29 focused frontend tests and TypeScript pass; no live AI generation.
