# Progressive local Studio V5

Set `VITE_STUDIO_PIPELINE_V5=true` in ignored `.env.studio-local` and keep search
V2 true. New sessions explicitly request V5; V5 takes precedence over V4/V3.
Existing sessions retain their server marker and original policy profile.

Backend migration 0011, the web service and `chat_async_worker` must be running.
V5 uses the exact partitioned V4 mother prompts. Its text turn runs in a durable
worker and acknowledges an operation identity before the model completes.

The discovery view displays validated analysis during design, then the complete
design while products are searched. Candidate groups arrive independently and
are labelled provisional. Full owner reload restores previews and stage labels;
compact polling contains only progress/revision/deadline. A matching parent text
operation may hand off to its explicitly announced render child; unrelated
operation pushes never update the active command.

Stage/candidate data never creates a fake completed plan. Shared basket approval
and commerce constraints remain on the backend. Product visual opinion concerns
family photos; image review concerns visible execution. The review panel and
image status expose unknown/conflicting/unavailable review without claiming real
dimensions or exact variants. No automatic paid image regeneration occurs.

For new-session rollback turn V5 off, V4 on, backend default V4, then restart.
Saved V5 sessions require V5-capable backend code. Keep the additive checkpoint
column rather than deleting operation history during rollback.
