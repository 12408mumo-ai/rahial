# CREE WRLD

A fast, minimalist, high-contrast storefront for curated sneakers, streetwear, Old Money, and Y2K pieces. The app is intentionally public-only: it reads available products and creates purchase orders. Inventory and images are managed in the Supabase Dashboard.

## Stack

- Vite 8 + React 19, written entirely in JavaScript/JSX
- `@supabase/supabase-js` with a wrapped `fetch`
- Vitest + Testing Library unit and end-to-end coverage
- ESLint flat config, zero-warning policy

## Run locally

```bash
npm install
npm run dev
```

The committed `.env` contains the project URL and its public publishable key for `vagnxflwjldokhqvyrqg`. Public keys are expected to be visible in browser code and are protected by RLS. Never add a service-role key to any client environment file.

Both naming conventions are supported, including a mix of the two:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key

# or
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

`vite.config.js` validates these values before compilation. A missing URL or key stops the build with an explicit error. `src/lib/supabase.js` wraps fetch so every Supabase API request carries `apikey` and `Authorization: Bearer <key>`.

## Supabase data contract

The storefront uses this query for the catalog:

```js
supabase
  .from('products')
  .select('*, categories(name, slug)')
  .eq('in_stock', true)
  .order('created_at', { ascending: false })
```

- `products.sizes` is a PostgreSQL text array; both native arrays and `{M,L}` literals are rendered.
- `products.image_url` is read directly. Upload files to the public `product-images` Storage bucket in the Dashboard and store the full public object URL, for example:
  `https://vagnxflwjldokhqvyrqg.supabase.co/storage/v1/object/public/product-images/photo.jpg`
- Category filters are `Sneakers`, `Streetwear`, `Old Money`, and `Y2K`.
- Checkout collects the customer's name, `customer_phone`, and `delivery_area`.
- Orders are created with `supabase.from('orders').insert(orderPayload)` and deliberately do **not** call `.select()`, matching anonymous insert-only permissions.

The project currently has no product rows, so a fresh deployment shows the designed empty state until items are added in the Dashboard.

## Security model

There is no admin drawer, login modal, passphrase gate, or admin session state in the frontend. The client uses no auth persistence, and public sign-ups are disabled in Supabase Auth.

`supabase/migrations/20261027090000_lock_anonymous_mutations.sql` was applied to the project. The live policy set is now:

| Table | Anonymous grant | RLS policy |
| --- | --- | --- |
| `products` | `SELECT` | public read |
| `categories` | `SELECT` | public read |
| `orders` | `INSERT` | public order placement |
| `order_items` | none | no public access |
| `admins` | none | no public access |

Authenticated/storefront roles cannot create, update, or delete products. Dashboard management continues through privileged Supabase roles that bypass RLS.

Supabase owns the managed `storage.objects` table, so its built-in policies are administered from the Dashboard rather than this migration. The app never performs a Storage mutation; uploads stay a Dashboard task. For a fully locked bucket, remove any anonymous/authenticated INSERT, UPDATE, or DELETE policies on `product-images` in the Dashboard and keep only public SELECT.

## Quality checks

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm test
npm run build
npm run check
```

The end-to-end test starts a local PostgREST-compatible HTTP server and drives the real React app and real Supabase client through category filtering, cart, checkout, header injection, and insert-only order creation. No browser download or external network service is required.
