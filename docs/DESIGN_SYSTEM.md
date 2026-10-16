# Tapbound: a place-first beer guide

The first screen must give people a reason to go out: a real venue, its photograph, and real beers. Utility supports that experience.

## Composition

- Taproom and nearby discovery open directly on real venue cards. No introduction, permission landing page or second navigation bar sits above the content.
- A single compact toolbar contains location, search and filters. Search and filters open a native dialog with keyboard focus containment, Escape dismissal and an explicit results action.
- Mobile must show the first brewery name and first actual beer within 600 CSS pixels when the first venue has a current menu. Automated checks enforce this content hierarchy.
- Site navigation is shared between desktop and mobile. The bottom navigation already provides Explore, On Tap, Plan and My Trails; do not duplicate those destinations above each view.
- Before location is granted, show the NYC catalog without claiming proximity. After permission, sort by straight-line distance and respect the chosen radius.

## Character

Use real brewery photography, warm paper, deep green, copper accents and an editorial serif display face. Brewery names sit on a darkened photo with sufficient contrast. Current menu previews supply the personality: exact beer names, original styles and ABV.

Beer cards make the beer name prominent and retain venue identity, source details, saving and trail actions. Do not fabricate packaging art or tasting descriptions to decorate them. Missing photography and unknown menus remain explicit.

`interface.css` owns the shared interface decisions. `globals.css` retains underlying page layout rules. New features must follow the composition above rather than add another block of controls to the first screen.

## Verification

Review actual browser screenshots at phone sizes. Test search, filters, permission denial, geolocation, saved beers and trail persistence. Use WebKit as well as Chromium for mobile behavior; this is browser verification, not customer research or a physical iPhone test. Never call a deployment complete without checking the public site.
