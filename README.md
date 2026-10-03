# MY WISHLIST — GitHub Pages + Supabase

A shared wishlist with a collage/sticker-inspired design.

## Features

- animated/visual start screen
- `MY WISHLIST` header
- purple, pink, blue and yellow sticker aesthetic
- manual product creation
- product URL
- image URL (no file upload)
- description
- price in BYN
- click a card to open a large detail view
- visual `RESERVED` badge
- reserve / unreserve
- delete wishes
- shared Supabase PostgreSQL database
- Supabase Realtime updates between visitors
- no localStorage database
- no owner/admin login

## Important

This version intentionally allows ANY visitor to:

- add wishes
- reserve/unreserve wishes
- delete wishes

Do not use this exact permission model if the wishlist needs private/admin-only editing.

## Setup

1. Create/open a Supabase project.
2. Open Supabase -> SQL Editor.
3. Run `supabase.sql`.
4. Open Supabase -> Settings -> API.
5. Copy Project URL and Publishable key.
6. Paste them into `app.js`:

```js
const SUPABASE_URL = "YOUR_PROJECT_URL";
const SUPABASE_KEY = "YOUR_PUBLISHABLE_KEY";
```

Do NOT use a `service_role` key.

7. Create a GitHub repository.
8. Upload `index.html`, `style.css`, `app.js`, `supabase.sql`, and `README.md` to the root of the repository.
9. Open GitHub -> repository Settings -> Pages.
10. Select `Deploy from a branch`, then `main` and `/ (root)`.
11. Save and open the generated GitHub Pages URL.

## Adding a product

Click `ДОБАВИТЬ ЖЕЛАНИЕ` and enter:

- title
- product URL
- direct image URL
- description
- price in BYN

For the image field, use a URL that directly returns the image. For example:

`https://example.com/photo.jpg`

A normal product-page URL is not necessarily an image URL.

## Testing shared data

Open the GitHub Pages site in two different browsers/devices.

1. Add a wish in browser A.
2. It should appear in browser B.
3. Reserve it in browser B.
4. The RESERVED badge should appear in browser A.
5. Delete it in either browser.
6. It should disappear from both.

If live changes do not appear automatically, check that `public.wishes` is enabled for Realtime in Supabase.
