# Local Studio pipeline V4

V4 uses the same two sequential model stages and full final document as V3,
with verbatim policy blocks assigned to their owning stage. Original room images,
user input, complete analysis and contextual constraints remain available.

Set `VITE_STUDIO_PIPELINE_V4=true` in ignored `.env.studio-local` for **new**
conversations. Keep `VITE_STUDIO_SEARCH_V2=true`. V4 takes precedence if the old
V3 flag is also true. Saved V3 conversations continue using their original policy.

To compare or roll back new conversations, turn the V4 flag off and use the V3
flag/backend V3 default. No session data is rewritten. Cost reporting continues
to separate actual receipts from token estimates; reduced system text is not a
guarantee of the same percentage reduction in total cost or processing time.
