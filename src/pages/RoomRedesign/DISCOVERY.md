# Studio processing and analysis presentation

The workspace occupies the visible viewport below the shared header. Photo,
accepted milestones, current service status and actions remain in view. Mobile
uses a compact original-photo strip; only the reading area scrolls for expanded
or long content. Do not restore a large mobile photo above the current status.

Milestones advance from accepted analysis, a saved plan and terminal success,
not timers or estimated percentages. The clock measures time on this page;
it is not a model-runtime estimate. A response without analysis opens the
conversation instead of displaying an endless analysis loader.

`buildDiscoveryReview(plan, preview)` combines early analysis with later design
instructions per scene, without modifying either source or model input. Saved
analysis remains available after an output error. Only an explicit wait action
allows automatic result navigation, and an error must prevent that navigation.

When available, show the saved positive diagnosis before revealing individual
observations. The next action begins the finding review; returning to the first
impression preserves the selected finding. Later design updates must not reset
the reading position. If there is no positive diagnosis, go directly to actual
findings, without an empty extra step. A ready result changes the status and
primary action while the review remains available. No timed progression or
mandatory reading delay is used. Result entrance motion respects reduced motion;
an explicit result action moves focus to the result heading.

The chat and local export settings open above the workspace in accessible
dialogs. Their content must not push status or findings below the viewport.

Local development only: `/studio/preview` shows initial loading without model
calls; `/studio/preview?state=review` shows fixture analysis. The Options panel
switches loading, analysis, ready and error fixtures. This route is gated to
loopback `studio-local` development and is absent in production.
The ready fixture can open the existing illustrative result view to check the
entire transition without creating a session or calling a model.
