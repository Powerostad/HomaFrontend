# Printable Studio design report

Adds a labelled Print report / PDF action on the shared Studio result screen.
The preview uses saved data from the viewed version, not a new model call.
The existing image-download action is preserved.

Contents: before/proposed-after figures, saved summary, documented observations
and linked solutions, changes, product photos and quantities/prices, known-price
subtotal, separate layout work and services/external sourcing. Selected products
replace that group's default recommendation; unselected alternatives do not
inflate totals. Unknown prices remain unknown. There is no checkout/invoice
claim, new price lookup, API cost, private prompt or conversation history.

A4 print CSS isolates a body-level print portal from every screen overlay and
navigation element. The user explicitly opens preview, then Print / Save PDF,
and chooses a printer or Save as PDF in their browser. Fonts/images are awaited
with a 12-second bound; unresolved assets block printing with a retry message.
Missing images have an explicit placeholder, not an invented after image.

Reference PDF was inspected visually and text-extracted. It is one very long
page; this implementation deliberately uses A4 pagination instead.

Verification: 203 tests passed before final CSS/readiness guard changes; targeted
print tests cover pricing, product selection, observed-vs-proposed distinction,
missing images, HTML escaping, on-demand printing and media readiness. Persian
desktop and 375px mobile previews were inspected; all three fixture images loaded
and document width remained 375px. No paid AI call or deployment performed.

Limitation: an actual saved browser PDF and physical page breaks still require
manual print-dialog verification; preview inspection is not PDF rendering proof.
