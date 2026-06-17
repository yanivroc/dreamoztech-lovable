# Shopping Cart + Square Payments

## What you'll get
- "Add to Cart" button on each product card and the product detail page.
- A cart drawer (slide-out from the right) accessible from a cart icon in the navbar with a live item count badge.
- Inside the cart: line items with image, title, qty +/- controls, remove button, subtotal, **flat $10 delivery fee**, and grand total — all shown in the member's currency (AUD).
- A "Checkout" button that opens a checkout page asking for name, email, phone, and shipping address, then renders the **Square Web Payments SDK** card form (sandbox).
- On submit: card is tokenized client-side by Square, token is sent to a server function which charges via the Square Payments API (sandbox) using your Access Token + Location ID, then shows a success screen and clears the cart.
- Cart persists across reloads via `localStorage`.

## Where things live (technical)
- **Secrets (stored server-side, not in code):** `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_ENVIRONMENT=sandbox`.
- **Public (safe in code, needed by browser SDK):** `SQUARE_APPLICATION_ID` and `SQUARE_LOCATION_ID` — exposed via a small server fn `getSquarePublicConfig()` so we don't hardcode.
- `src/lib/cart.tsx` — `CartProvider` + `useCart()` hook (items, add/remove/updateQty/clear, totals). Persists to localStorage.
- `src/components/CartDrawer.tsx` — slide-out drawer using shadcn `Sheet`.
- `src/components/CartButton.tsx` — navbar icon with badge; added to `SiteHeader`.
- `src/routes/checkout.tsx` — checkout page with address form + Square card form (loads `https://sandbox.web.squarecdn.com/v1/square.js`).
- `src/lib/square.functions.ts` — `getSquarePublicConfig` (GET) and `createSquarePayment` (POST: takes nonce, amount cents, currency, buyer info; calls Square `/v2/payments`).
- `src/lib/square.server.ts` — fetch wrapper for Square sandbox API.
- Add to Cart wired into `src/routes/index.tsx` product cards and `src/routes/$slug.tsx` detail page.
- `src/routes/__root.tsx` wraps app in `CartProvider`.

## Flow
1. User clicks "Add to Cart" → toast + badge updates.
2. Opens drawer → reviews → "Checkout".
3. `/checkout` shows address form + Square card input. Total = items + $10 delivery.
4. On pay: Square SDK tokenizes card → POST to `createSquarePayment` server fn → Square charges in sandbox → success screen, cart cleared.

## Notes
- Sandbox test card: `4111 1111 1111 1111`, any future expiry, any CVV, any postcode.
- Delivery flat $10 in the member's currency (AUD).
- I'll add the 3 Square secrets via the secrets tool after you approve.