# Motion implementation

Live reference inspected in the in-app browser on 2026-10-03: https://dennissnellenberg.com/ (home, work list, about and footer). Plain web fetching returned 403; browser navigation worked. No saved source pages, remote scripts, font files or third-party artwork were read or imported for this implementation.

## Observed behavior and adaptation

| Area | Observed on reference | Own implementation |
| --- | --- | --- |
| Introduction | Full-screen dark surface cycles through short greetings, then reveals the page. | Three original labels based on Denis's profile; about 0.85 seconds total, dismissible by click or keyboard, with scrolling locked, once per tab session. Exit moves a curved curtain upward. |
| Navigation | Round trigger appears on scroll. A right drawer overlays a dimmed page; links enter in sequence. | Native modal dialog, independently animated curved edge, staggered links, animated closing, Tab wrapping, Escape and focus return. Existing menu size and type retained. |
| Cursor | Default cursor outside work. Hover gives a round action label over the work preview. | Own monochrome label on categories and work thumbnails, with a faster follower than the image preview. |
| Works | Hovered row fades; floating image follows the mouse with lag; moving to another row switches the image vertically. | Existing user category rows retained; rebuilt follower controller, original work images and vertical image track. Actual works still open the existing viewer. |
| Page change | Dark interstitial shows the destination name before the new page. | Own curved curtain around ordinary HTML navigation; anchors, external links, modified clicks, downloads and certificate links retain normal behavior. |
| Footer | Light rounded boundary leads to a dark contact area; contact button is magnetic and its fill responds to hover. | Existing user footer with a small scroll-driven curve and content offset, spring displacement on its round button. Contact links and layout retained. |

Exact original durations and underlying implementation were not inspected. Timings and geometry here are independently chosen, not a pixel copy. Native scrolling remains intact.

## Additional references required by the project workflow

- Existing DESIGN.md read; the project's grayscale override in USER-BRIEF.md remains authoritative. No new style document or fonts introduced.
- https://21st.dev/community/components/s/navigation-menu checked for navigation patterns; no registry components installed.
- https://component.gallery/components/drawer/ and https://shoelace.style/components/drawer inspected for modal drawer behavior and focus/closing semantics. Implementation uses native dialog, not Shoelace.
- Actual Kinetics Magnetic Button and Pointer Tooltip prompts read at https://kinetics.colorion.co/. Their motion concepts informed the own spring button and eased follower. No runtime library added.

## Validation

- Real browser: first-visit loader exits; menu opening/closing; Tab and Shift+Tab wrapping; Escape restores focus; menu link navigates to resume; curtain exits; browser Back recovers.
- Real browser: category preview swaps, filters show 2/2 interfaces; disclosure updates 7/12 to 12/12; viewer opens and closes; EON panorama remains scrollable.
- Real browser: pause affects marquee and hover, persists to resume; restarting motion works; footer button displacement observed and settles back.
- Mobile viewport 390×844: menu fits, both pages have no horizontal document overflow; cursor and category preview hidden; filters and EON viewer work.
- Node/JSDOM regression checks cover script-free content, simulated reduced-motion branches, preference changes during introduction, saved pause, and cancellation of follow loops. This is a simulation of the media preference, not an OS preference change.
- No console errors observed. Asset links and certificate hashes checked; original academic PDFs and redacted language copies unchanged.

Changes are local and reviewable. GitHub Pages has not been redeployed in this turn.

## Portfolio usability refinement

- Two presentations visible; five additional presentations use a regular button and the same grid, without nested details layout. This disclosure is kept in All and Presentations per the latest user request.
- Category clicks bring the results heading into view and focus it; reset is available beside the count. Disclosure focuses the first newly shown work.
- Category previews retain the native pointer; the action badge only appears on actual work links.
- Previews now use a landscape frame with smaller padding.
- Hero gray is #686868, with white navigation; existing fonts remain.
- Responsive WebP display copies generated from 13 image groups; originals and certificate PDFs are unchanged. The largest display copies total 1,194,318 bytes compared with 12,062,765 bytes for those originals. This is a file-size comparison, not a measured first-load network budget.
- Browser checks at desktop 1280×900 and mobile 390×844: disclosure, counts, reset, result scrolling, menu, viewer, image loading, no horizontal overflow. Mobile results no longer collide with the round menu button. Regression checks include click-to-skip, scroll restoration, and two-plus-five filtering. Changes remain local.
