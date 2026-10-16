# Tapbound: customer research and product refinements

Research date: October 15, 2026

## Method and limits

This is secondary research: a desk review of four beer products, five brewery websites, and selected public customer reviews and discussions. It is not a customer interview study, a representative survey, or a measured usability experiment. The breweries are useful design benchmarks, not a ranked list of the world's best breweries. Older feedback is identified below; it does not establish that an old defect still exists.

## What the benchmarks teach us

| Benchmark | Useful pattern | Decision for Tapbound |
| --- | --- | --- |
| [Untappd](https://help.untappd.com/hc/en-us/articles/14811149192596-New-Registration-Free-Experience-on-Untappd) | Discovery can start without registration. | Keep browsing and personal beer saving account-free. |
| [BeerMenus](https://help.beermenus.com/article/28-beermenus-mobile) | Follow specific places and beers to make a large catalog personally relevant. | Start with a want-to-try list; defer notifications until their freshness and consent flows are ready. |
| [DigitalPour](https://play.google.com/store/apps/details?hl=en&id=com.digitalpour.menu) | Beer details and venue availability support decisions before a visit. | Put style, published ABV, available prices, venue and directions together. Tapbound has no live keg-level feed. |
| [BeerAdvocate](https://www.beeradvocate.com/beer/styles/) | Style knowledge adds depth beyond a name and score. | Retain exact source styles alongside approachable taste paths. Avoid invented ratings or tasting notes. |
| [Other Half](https://otherhalfbrewing.com/) | Location and purchase intent matter. | Keep each beer attached to the specific taproom where its menu was found. |
| [Grimm](https://grimmales.com/location/taproom/) | A brewery visit includes the space and food as well as beer. | Preserve photography and researched visit context. |
| [Threes Gowanus](https://threesbrewing.com/pages/gowanus) | A distinctive venue deserves more than a generic card. | Keep brewery detail pages, location identity and practical visit information. |
| [Trillium Fort Point](https://trilliumbrewing.com/pages/fort-point) | Draft, to-go, food and visit information serve different tasks. | Do not treat packaged inventory as proof that a beer is on draft. |
| [Tree House Charlton](https://treehousebrew.com/visiting-charlton-1) | Visit logistics are part of the product experience. | Maintain direct directions and a usable multi-stop trail. |

## Customer evidence and interpretation

**Remembering beers is a recurring job.** Selected visible [Untappd App Store reviews](https://apps.apple.com/us/app/untappd-beer-wine-spirits/id449141888?see-all=reviews&platform=ipad) describe remembering what someone tried, finding beer information, and checking menus. Several reviewers enjoy social features too. Dates on this page do not consistently include years, and repeated renderings of a review were not treated as independent evidence. Interpretation: personal memory is valuable without requiring Tapbound to build a social network.

**Menus and noise can coexist in the same product.** A [November 2023 Reddit discussion](https://www.reddit.com/r/beer/comments/184iqm4/untappd_sucks_as_an_app/) contains complaints about clutter alongside praise for tap menus and discovery. This is historical, self-selected and mixed feedback. Interpretation: make the next useful action obvious; it does not justify claiming everyone dislikes ratings or badges.

**Avoid making a visit harder than a brewery website.** Comments in a [2025 brewery-app discussion](https://www.reddit.com/r/CraftBeer/comments/1kdxxc7/beer_nerds_whats_the_one_feature_brewery_apps/) favor accessible hours, address and menu information, with some preferring websites over another download. The initiating post is a product-builder prompt, not independent customer validation. Interpretation: a fast mobile website and clear visit details fit the task.

**Visible controls matter.** On [DigitalPour's Google Play page](https://play.google.com/store/apps/details?hl=en&id=com.digitalpour.menu), a March 17, 2026 review praises pre-visit menu browsing but initially misses the Sizes control for prices; a developer reply explains it. A November 2020 review describes losing favorites after changing phones. These are individual reports, not prevalence estimates or proof of current defects. Interpretation: expose useful published details and state where saved data lives.

## Implemented refinements

- **Want to try:** save a beer from the beer board or its brewery page. A dedicated list survives reloads, links to the taproom, and adds a currently listed beer's venue to a trail. It clearly says that saves live in this browser; they do not sync across devices.
- **Practical beer filters:** combine borough, maximum ABV, taste or style, search, and “Taproom open now.” Filters persist in the URL. Search also recognizes brewery names and neighborhoods.
- **Useful detail at the decision point:** retain original styles and ABV, expose prices where the source provides them, and keep directions and trail actions close to the beer.
- **Preserve the guide:** keep brewery photography, all five boroughs, taste discovery, local picks and full brewery pages. These changes supplement the restored design.

## Truthfulness boundaries

A published menu checked within the existing 24-hour window is not a real-time stock guarantee. Saved beers that disappear from the current menu show “Current availability unknown”; saving one does not preserve an availability claim. Unknown ABV is excluded when an ABV ceiling is selected. Unknown hours are excluded by “open now,” and regular schedules cannot guarantee holiday or event hours. No beers, reviews, scores, release dates or tasting descriptions were invented for this work.

## Next validation: proposed, not performed

Recruit five NYC beer drinkers with mixed familiarity and ask each to: (1) find a Brooklyn beer at or below 5% ABV, (2) save it and find it after returning, and (3) identify its venue and build a two-stop outing. Observe on their own phones without explaining the controls. Initial acceptance targets: at least four of five complete each task unaided; everyone can explain the menu-age and browser-only-save limitations. Record failures and time on task; these are targets, not results.

Then prioritize observed friction. Consider optional account backup only if losing or transferring saved lists proves important. Add release alerts only with reliable change detection and explicit opt-in. Richer brewer-written descriptions should retain their source rather than becoming synthetic beer reviews.
