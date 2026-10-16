# Tapbound interface contract

Tapbound is a photo-led NYC brewery guide. Preserve sourced beer depth and the cream, dark-olive and copper identity.

- Discovery has three peer views: Taprooms, Near me, Beers. Use the shared discovery navigation and indicate the active view.
- Near me always offers real NYC taprooms before permission. Location refines the list; it must never gate the guide behind an empty utility screen.
- Site navigation uses a shared component for desktop and mobile, with visible active states. The logo uses an SVG arrow. Text arrows explicitly request text presentation to avoid iOS emoji substitutions.
- `interface.css` owns shared interface tokens, type sizes, control geometry, spacing and responsive card treatment. `globals.css` retains the underlying page layouts. Add new shared decisions to the interface layer rather than route-specific competing patches.
- Mobile page titles use the same 32px scale. Primary actions have 44px targets. Cards use a shared 12px radius. Supporting data must remain readable.
- Taproom photographs use wide crops, not tall narrow strips. Missing imagery stays an honest branded fallback.
- Permission and source details stay secondary. Never remove their substance or invent proximity, freshness, menus or beer descriptions.
- Verify home, both taproom views, beers, brewery detail, saved beers and planner at mobile widths before publishing. Browser tests supplement visual review; they do not replace it or constitute customer usability testing.
