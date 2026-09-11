# Public SEO interface decisions

Public pages follow DESIGN.md: warm neutrals, Vazirmatn, semantic tokens, image-led layouts, near-black actions, and Persian RTL. Private workflows retain their existing interfaces.

Task-first navigation preserves Studio while making product discovery a separate path. A catalog-first alternative would deprioritize Studio and depend on category merchandising absent from the current API.

Primary content uses ordinary links in server HTML without viewport gates. Request-local i18n starts in Persian; new content falls back to Persian when alternate locale resources do not contain it.

Products show supplied facts only. The browser commerce slot preserves basket, buy and variants. Demonstrations are examples, not verified customer results. Missing prices are not free products.

Terms retain all substantive wording from the existing page. Existing image retention/privacy assertions are carried forward, not independently revalidated. Contact omits unverified phone/performance/refund claims. Collaboration preserves its endpoint and fields, with localized errors and input retention.

Acceptance: 320/390/768/1440 widths; focus/skip link; native links; pagination; product missing data; collaboration failure; language menu; one H1; preserved commerce.

Public body and footer retain Persian language and RTL when header language changes; the header supports translated navigation in all four existing languages. Contact supports the user-verified Instagram account myhoma.ir through configured supportUrl, with an explicit unavailable state if missing. The original E-Namad seal HTML is preserved unchanged.
