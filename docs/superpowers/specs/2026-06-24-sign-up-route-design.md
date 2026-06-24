# Sign-up compatibility route

## Problem

External traffic can enter TOKRACE through `/sign-up`. The locale proxy redirects that URL to a localized path such as `/en/sign-up`, but the application has no page for that route, so the request ends in a 404 before the user can register.

Registration itself already works through `AccountDialog` on the arena page and calls Supabase Auth directly. The fix must reuse that flow rather than create a second registration implementation.

## Desired behavior

- `/sign-up` resolves the visitor's locale through the existing proxy.
- `/en/sign-up` redirects to `/en/arena?account=register`.
- `/zh-CN/sign-up` redirects to `/zh-CN/arena?account=register`.
- Existing query parameters, including referral parameters such as `ref`, are preserved.
- The arena consumes `account=register`, opens `AccountDialog`, selects register mode, and removes only the `account` parameter from the visible URL.
- Normal arena visits and manually opened account dialogs retain their current login-first behavior.

## Design

Add a localized compatibility page at `app/[lang]/sign-up/page.tsx`. It validates the locale using the existing i18n helpers, copies incoming search parameters, adds `account=register`, and performs a temporary server redirect to the localized arena route.

Extend `AccountDialog` with an optional initial mode. The arena reads the one-time `account` query parameter during its existing initial URL-consumption effect, opens the dialog in register mode, and cleans that parameter with `history.replaceState`. The initial mode is reset when the dialog is opened through ordinary account controls so later manual use is not forced into registration.

No authentication endpoint, Supabase configuration, database schema, or referral attribution logic changes.

## Error handling

- Unsupported locale values fall back through the existing locale normalization/default behavior.
- Unknown `account` values are ignored.
- Query parameters other than `account` remain untouched.
- If Supabase browser credentials are unavailable, the existing disabled-account message remains authoritative.

## Verification

- Add focused tests for building the localized sign-up destination while preserving query parameters.
- Add focused tests for recognizing and removing the one-time registration intent.
- Run the complete test suite.
- Run `next build`.
- Start the production server locally and verify `/sign-up`, `/en/sign-up`, and `/zh-CN/sign-up?ref=...` no longer return 404 and land on the arena registration flow.
