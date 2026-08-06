# FLEVA — Backend Setup (Supabase)

Your site now has real login/signup and real order storage instead of the
old browser-only demo version. Follow these steps once to connect it.

## 1. Create your Supabase project
1. Go to https://supabase.com and sign up (free)
2. Click "New project"
3. Pick a name (e.g. "fleva"), a database password (save it somewhere), and a region close to Bangladesh
4. Wait ~1-2 minutes for it to finish setting up

## 2. Get your API keys
1. In your new project, go to **Settings → API** (left sidebar)
2. Copy the **Project URL**
3. Copy the **anon / public** key (NOT the "service_role" key — never put that one in frontend code)

## 3. Paste them into your site
Open `supabase-config.js` and replace the two placeholder lines:

```js
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_ANON_KEY = "your-long-anon-key-here";
```

## 4. Create the database table
1. In Supabase, go to **SQL Editor** (left sidebar) → **New query**
2. Open `supabase-schema.sql` from this project, copy all of it
3. Paste into the SQL editor and click **Run**
4. You should see "Success. No rows returned" — that means your `orders`
   table and its security rules are live

## 5. (Recommended for testing) Turn off email confirmation
By default, Supabase makes new users confirm their email before they can
log in. While you're testing, this gets in the way. To turn it off:
1. Go to **Authentication → Providers → Email**
2. Turn off "Confirm email"
3. Save

(Turn this back on before you launch for real, so accounts are verified.)

## 6. Test it
Open `login.html` or `signup.html` in your browser (or via Live Server),
create an account, then place a test order through checkout. Go to
**Table Editor → orders** in Supabase — your order should be sitting
there.

---

## What's real now vs. what's still a placeholder

**Real:**
- Sign up / log in / log out (Supabase Auth)
- Orders are saved to a real database, tied to the logged-in user
- Order history on the account page pulls real data

**Still a placeholder:**
- Payment method is **Cash on Delivery only**. bKash and Nagad show as
  options in the UI, but nothing actually charges yet. To accept real
  bKash/Nagad payments, you'll need to register as a merchant with them
  directly, or use a payment aggregator like SSLCommerz (which supports
  bKash + Nagad + cards through one integration). Once you have those
  credentials, I can wire up the real payment flow.
- Product info (name, price, description) still lives in `script.js`,
  not the database. Fine for a small catalog — worth moving to a
  `products` table in Supabase if you want to add/edit products without
  touching code.
