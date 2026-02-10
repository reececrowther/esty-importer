# Etsy Store Connection Setup

This guide walks you through connecting your Etsy store so you can upload listings (with mockup images) from the app.

---

## 1. Register an Etsy App

1. Go to **[Etsy Developers → Your Apps](https://www.etsy.com/developers/your-apps)** and sign in with your Etsy account.
2. Click **Create a new application** (or **Register new app**).
3. Fill in the app details as follows.

### What to enter in the Etsy app form

| Field | What to write |
|-------|----------------|
| **App name** | `Esty Importer` (or e.g. `My Mockup Lister`) |
| **Short description** | `Uploads listings and mockup images to my Etsy shop. I use it to create draft listings from designs and PSD mockups.` |
| **App description** (if asked) | `A local tool for creating product mockups and publishing them as draft Etsy listings. Used only by me to manage my own shop.` |
| **Redirect URL(s)** | See below. |

### Redirect URL (required)

Etsy will send users back to your app after they approve access. You must add **exactly** this URL in your Etsy app settings.

- **Local development:**  
  `http://localhost:3000/api/etsy/callback`

- **Production (when you deploy):**  
  `https://your-domain.com/api/etsy/callback`  
  Replace `your-domain.com` with your real domain (e.g. `https://esty-importer.vercel.app/api/etsy/callback`).

**Important:** The URL must match **exactly** (no trailing slash, same protocol and host). Add both local and production URLs if you use both.

4. After creating the app, open it and copy:
   - **API Key** (keystring)
   - **Shared secret** (if shown; some endpoints use it for `x-api-key`)

---

## 2. Configure environment variables

Copy the example env file if you haven’t already:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Required for Etsy OAuth and uploads
ETSY_API_KEY=your_api_key_keystring_here

# Optional: use if Etsy requires "keystring:sharedsecret" for x-api-key
ETSY_SHARED_SECRET=your_shared_secret_here

# Where your app is running (used for OAuth redirect and image URLs)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set `NEXT_PUBLIC_APP_URL` to your real URL (e.g. `https://your-domain.com`).

Optional:

- **ETSY_SHOP_ID** – Only if the app can’t get your shop from the API (e.g. single-shop dev). You can find your shop ID in your Etsy shop URL or API docs.

---

## 3. Use the app

1. Run the app: `npm run dev`
2. Open the app in the browser (e.g. `http://localhost:3000`).
3. Create mockups and generate listing content as usual.
4. In the **Generate Etsy Listing** section, click **Connect Etsy Store**.
5. Approve the app on Etsy when prompted.
6. You’ll be redirected back; the app will show **Etsy connected**.
7. Click **Upload to Etsy** to create a draft listing with your mockup images.

Listings are created as **drafts** so you can review and edit price, inventory, etc. in Etsy before publishing.

---

## Troubleshooting

- **“Etsy API is not configured”** – Set `ETSY_API_KEY` and `NEXT_PUBLIC_APP_URL` in `.env`.
- **Redirect or “invalid redirect_uri”** – The redirect URL in Etsy must match exactly (including `http` vs `https`, no trailing slash).
- **“Etsy store not connected”** – Connect again via **Connect Etsy Store**; if you changed domain or port, update the redirect URL in Etsy and `NEXT_PUBLIC_APP_URL`.
- **Upload fails (401/403)** – Ensure your Etsy app has the right scopes (`listings_r`, `listings_w`, `shops_r`); reconnecting may be required after changing scopes.
