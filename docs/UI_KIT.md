# Current status

The dashboard shell was removed from the active experience after user review. The photo-led brewery guide, direct discovery sections, and mobile bottom navigation are restored. Vendored components and attribution remain available for targeted reuse; the notes below describe their provenance, not the active page layout.

# UI foundation

Tapbound adapts Sat Naing's shadcn-admin, https://github.com/satnaing/shadcn-admin, revision e16c87f213a5ba5e45964e9b67c792105ec74d26 (15,756 GitHub stars at selection, October 15, 2026).

Actual vendored components: sidebar (including responsive drawer, collapse and keyboard shortcut), header, button, input, separator, sheet, skeleton, tooltip, card, badge and tabs; mobile breakpoint hook; theme tokens. Original MIT license retained in licenses/shadcn-admin-MIT.txt. Source files mark attribution. The app shell adapts the upstream layout composition for Next.js links, beer navigation and public discovery; there are no fake accounts or admin metrics. Skeleton width is deterministic for React hydration.

The compact homepage has one active content panel: new drops, taprooms or local picks. Taste chips route into filtered beer lists; global search routes to brewery discovery; sidebar borough links and trail actions work. Radix supplies tab keyboard navigation, drawer focus management and dismissal.
