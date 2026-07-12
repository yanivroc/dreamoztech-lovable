# Layout Themes (rearrange, not just recolor)

## What you'll get
A second dropdown in the top-right — **Layout** — separate from the existing Theme (color) dropdown. Pick a layout and the whole homepage rearranges. Persisted in localStorage like the color theme.

## 5 layout modes

1. **Classic** (current) — sticky top nav, hero, product grid (3 cols), footer.
2. **Sidebar** — vertical left sidebar nav (logo + links + cart + theme), main content scrolls on the right, products in a 2-col grid.
3. **Magazine** — big editorial hero, one **featured product** full-width, rest of products in an asymmetric masonry (mixed tall/wide tiles).
4. **Compact** — dense list view: thin top bar, products as horizontal rows (image left, title/price/CTA right), 1 col mobile / 2 col desktop. Great for browsing lots of items fast.
5. **Showcase** — centered single-column, hero takes full viewport, products shown one-at-a-time as large cards you scroll through (snap scroll), nav collapses into a floating pill at the bottom.

Each layout also nudges spacing, card style, and typography scale to feel distinct — but colors stay controlled by the existing Theme picker, so the two are composable (e.g. "Nightly + Magazine", "Sunny + Compact").

## Where the switch lives
Header top-right, next to the color theme dropdown:
```
[ Layout ▾ ]  [ 🎨 Theme ▾ ]  [ 🛒 ]
```
Same shadcn `DropdownMenu` pattern as the theme picker, with a tiny wireframe icon per option.

## How it works (technical)
- New `src/lib/layout-theme.tsx` — `LayoutProvider` + `useLayout()` hook, `LAYOUTS` list, localStorage key `site-layout`, sets `document.documentElement.dataset.layout="magazine"` etc. No-flash inline script, same pattern as theme.
- New `src/components/LayoutSwitcher.tsx` — dropdown mounted in `SiteChrome` header.
- Refactor `src/routes/index.tsx`:
  - Read `useLayout()` and branch the page structure into 5 render paths, each rendering the same underlying data (hero content, product list) in a different arrangement.
  - Keep product data fetching and cart wiring identical — only presentation changes.
- `src/components/SiteChrome.tsx` — the sidebar layout needs the header to render as a vertical rail instead. Simplest approach: `SiteHeader` reads `useLayout()` and returns either the current top bar or a `<aside>` rail; `RootComponent` wraps `<Outlet />` accordingly. To keep this contained I'll do the sidebar variant at the page level (index.tsx renders its own left rail and hides the global header via a `data-hide-header` class the header respects) — cleaner than restructuring the root layout.
- Layout-specific tweaks (grid columns, gaps, card shape) applied via Tailwind classes conditional on the layout id — no new CSS tokens needed.

## Scope guardrails
- Only the **homepage** (`src/routes/index.tsx`) rearranges. Product detail (`$slug.tsx`) and checkout stay as-is — they're single-purpose pages where layout variants don't help.
- No changes to cart, checkout, Square, invoice, email, product data.
- Color themes and layout themes are independent and combine freely.

## Files touched
- `src/lib/layout-theme.tsx` — new
- `src/components/LayoutSwitcher.tsx` — new
- `src/components/SiteChrome.tsx` — mount switcher + respect hide-header signal from sidebar layout
- `src/routes/__root.tsx` — wrap in `LayoutProvider`, inject no-flash script
- `src/routes/index.tsx` — 5 layout render branches over the same data
