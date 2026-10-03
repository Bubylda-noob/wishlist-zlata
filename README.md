# MY WISHLIST

A small public wishlist built with plain HTML/CSS/JavaScript + Supabase.

## Features

- collage/sticker-inspired design
- `MY WISHLIST` header
- manual product creation
- product URL
- uploaded product image
- description
- price in BYN
- reserve / unreserve
- delete item
- shared PostgreSQL database
- Supabase Storage for images
- Realtime updates between visitors
- no localStorage database

## Files

- `index.html` — page structure
- `style.css` — design
- `app.js` — Supabase connection and all logic
- `supabase.sql` — database + RLS + Storage setup

## Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase.sql`.
3. Open Supabase Settings -> API.
4. Copy Project URL and Publishable key.
5. Paste them into `app.js`:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
6. Create a GitHub repository and upload all project files.
7. Enable GitHub Pages:
   Settings -> Pages -> Deploy from a branch -> main -> /(root).
8. Open the generated GitHub Pages URL.

### Important security note

This version intentionally allows anonymous visitors to add, reserve, unreserve and delete wishlist items, because the requested site does not use accounts.

If later you want only the owner to be able to add/delete items while everyone can reserve them, add Supabase Auth and tighten the RLS policies. Do not put a Supabase `service_role` key into this project.

## Testing

Open the site in two different browser windows/devices.

1. Add a wish in window A.
2. It should appear in window B.
3. Reserve it in window B.
4. The RESERVED sticker should appear in window A.
5. Delete it in either window and it should disappear from both.

If updates do not appear automatically, check that `public.wishes` is enabled for Realtime in Supabase.
