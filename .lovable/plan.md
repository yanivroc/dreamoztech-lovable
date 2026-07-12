# Theme Switcher with 10+ Themes

## What you'll get
- A **theme dropdown** in the top-right of the site header (next to the cart icon) showing the current theme name with a small swatch and a chevron.
- **12 curated themes**, each retheming the entire site (background, cards, nav, buttons, product cards, footer, cart drawer, checkout — everything using semantic tokens):
  1. **Sunny** — warm cream + amber accents, bright and cheerful
  2. **Paramount** — clean white + deep navy, corporate/premium
  3. **Dark** — charcoal + soft white, comfortable dark mode
  4. **Nightly** — near-black + electric indigo, sleek tech
  5. **Starry** — deep midnight blue + gold accents
  6. **Ocean** — light + deep teals and blues, calm
  7. **Forest** — off-white + deep greens, natural
  8. **Sunset** — warm peach + magenta/orange accents
  9. **Noir** — pure black + white + single red accent, brutalist
  10. **Rose** — blush pink + burgundy, elegant
  11. **Mono** — pure grayscale, minimal editorial
  12. **Cyber** — black + neon mint/cyan, futuristic
- Selected theme **persists across reloads** (localStorage) and applies instantly with a smooth color transition.
- Works site-wide because every component already uses semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.) — no per-component changes needed.

## How it works (technical)
- Add a `data-theme="sunny"` (etc.) attribute on `<html>`. Each theme is a CSS block in `src/styles.css` like `[data-theme="sunny"] { --background: ...; --primary: ...; ... }` overriding the same tokens `:root` already defines.
- New `src/lib/theme.tsx` — `ThemeProvider` + `useTheme()` hook. Reads/writes `localStorage["site-theme"]`, sets `document.documentElement.dataset.theme`. Exports `THEMES` list `[{ id, name, swatch }]`.
- New `src/components/ThemeSwitcher.tsx` — shadcn `DropdownMenu` trigger button (theme name + colored dot + chevron). Menu lists all 12 themes with a small swatch preview and a check next to the active one.
- Wrap app in `<ThemeProvider>` inside `src/routes/__root.tsx` (inside `CartProvider`).
- Add `<ThemeSwitcher />` to `src/components/SiteChrome.tsx` in the header `<ul>` before the `<CartButton />`.
- Add a subtle `transition: background-color 200ms, color 200ms` on `body` so theme changes feel smooth.
- SSR safety: initial `data-theme` is set via a tiny inline script injected in `__root.tsx` head (like next-themes) so there's no flash of wrong theme.

## Not changing
- No changes to product data, cart, checkout, Square, invoice, or email logic.
- No changes to fonts or layout structure — only color tokens.
- The existing `.dark` class still works; it's just superseded when a `data-theme` is set.

## Files touched
- `src/styles.css` — add 12 `[data-theme="..."]` blocks + body transition
- `src/lib/theme.tsx` — new
- `src/components/ThemeSwitcher.tsx` — new
- `src/routes/__root.tsx` — wrap in ThemeProvider, inject no-flash script
- `src/components/SiteChrome.tsx` — mount `<ThemeSwitcher />` in header
