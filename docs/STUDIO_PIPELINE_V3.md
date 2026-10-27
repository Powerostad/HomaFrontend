# Local Studio pipeline V3

Set `VITE_STUDIO_PIPELINE_V3=true` in the ignored `.env.studio-local`, then run
the existing Studio local Vite mode. New sessions explicitly request
`pipeline_version=studio-pipeline-v3`, with the complete V2 design contract.
Keep `VITE_STUDIO_SEARCH_V2=true` for the existing catalogue flow.

Existing sessions retain their saved pipeline. To compare with the previous
flow, disable the V3 frontend flag and select the backend V2 new-session default;
create a separate conversation rather than silently changing a saved one.

The private output/cost report separates confirmed provider receipts from the
new reported-token tariff estimate. Analysis, design and failed attempts appear
as separate stage rows. Missing usage or prices remain unknown. Unknown cache
counts produce a range; partial totals disclose coverage. Image estimates are
excluded and image billing continues through confirmed provider receipts.
No token counts are guessed from characters and no exchange rate is guessed.

The mother prompt remains complete in both backend stages; the final saved
document is the existing full `studio-design-v2` schema.
