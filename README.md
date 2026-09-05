# Rakesh Cloth Stores — Premium Boutique Website

This is a **separate project** from Butta Bomma. Same emerald + gold boutique look, plus **video-call confirmation after the store confirms an order**. Payment is **WhatsApp only** (COD or UPI) — no Razorpay.

Project folder:

`c:\Users\tarun\Downloads\Rakesh_Cloth_Stores`

## Customer experience
- Emerald green + gold luxury theme
- Shop by category and **price range** (admin can edit those ranges)
- Maximum **5 different products** in the bag
- Place Order opens WhatsApp, then the customer form
- **My Orders** lookup by the same mobile number
- Status: Pending → Confirmed → Delivered
- **Video call stays locked until the store confirms**
- After confirmation, customer and admin join the same private room (**10:00 AM – 8:30 PM**)
- Admin dashboard is hidden. Open it with **Ctrl + Shift + R**

## Admin
- Shortcut: **Ctrl + Shift + R** (tiny ✦ in the footer also works)
- Default login: `admin` / `1234` — change this immediately in Settings
- Upload saree photos from gallery or camera — files save on the server
- Confirming an order deducts stock and unlocks the video call
- **Price Ranges** tab: add / edit / remove the homepage price buttons

## Local run
Needs **Node.js 22+**.

```bash
cd c:\Users\tarun\Downloads\Rakesh_Cloth_Stores
npm install
npm run dev
```

Open http://localhost:5173

---

## Deploy on the web with GitHub (no Hostinger)

This website needs a **Node.js server** (not GitHub Pages). GitHub stores the code. **Render** (or Railway) runs it on the internet.

### Step 1 — Buy a domain (optional, can do later)
Buy `rakeshclothstores.com` or `.in` from:
- [Namecheap](https://www.namecheap.com)
- [GoDaddy](https://www.godaddy.com)
- [Google Domains / Squarespace](https://domains.squarespace.com)

You can also skip this first and use a free `onrender.com` address.

### Step 2 — Put the project on GitHub
1. Create a free account at [github.com](https://github.com)
2. Click **New repository**
3. Name it `rakesh-cloth-stores`
4. Keep it **Private** if you want
5. Do **not** add a README (the project already has one)

On your computer, in PowerShell:

```bash
cd c:\Users\tarun\Downloads\Rakesh_Cloth_Stores
git init
git add .
git commit -m "Rakesh Cloth Stores website"
git branch -M main
git remote add origin https://github.com/YOUR-GITHUB-USERNAME/rakesh-cloth-stores.git
git push -u origin main
```

Replace `YOUR-GITHUB-USERNAME` with your GitHub name. GitHub will ask you to sign in.

### Step 3 — Host it on Render (recommended)
1. Go to [https://render.com](https://render.com) and sign up with **GitHub**
2. Click **New +** → **Blueprint**
3. Select the `rakesh-cloth-stores` repo
4. Render reads `render.yaml` and creates the website
5. Add environment variable `CORS_ORIGINS` = `https://your-site.onrender.com` (and later your real domain)
6. Click **Apply** / **Create**

Wait 3–8 minutes. Render gives a URL like:

`https://rakesh-cloth-stores.onrender.com`

That is the live website.

If Blueprint is not shown: **New +** → **Web Service** → connect the repo, then:
- **Runtime:** Node
- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- Add a **Disk** mounted at `/var/data` (so saree photos and orders stay saved)
- Environment: `NODE_ENV=production`, `DATA_DIR=/var/data`, `JWT_SECRET=` (long random text)

### Step 4 — Connect your own domain
In Render → your service → **Settings** → **Custom Domains** → add `rakeshclothstores.com`.

Then in Namecheap / GoDaddy:
- Add a **CNAME** from `www` to the Render address they show
- Add an **A** record or ALIAS for the root domain as Render instructs

Wait 15 minutes to a few hours.

### Step 5 — After it is live
Open the live site → **Ctrl + Shift + R** → login `admin` / `1234` → Settings → change the password.  
Upload real saree photos from **Add Product**.

---

## Other hosts (same GitHub repo)

**Railway** — [railway.app](https://railway.app)  
New Project → Deploy from GitHub → select this repo → set start command `npm start` → add volume for `/var/data` → set `DATA_DIR=/var/data`.

**Fly.io** — more technical; use if you already know Fly.

**GitHub Pages / Netlify / Vercel alone will not work** for this shop, because orders, admin login, and uploaded saree photos need a real Node server and saved files.

WhatsApp: +91 99857 28175  
Instagram: [@rakesh_mahanthy](https://www.instagram.com/rakesh_mahanthy/)  
Developed by **Vikatech** — [vikatechit@gmail.com](mailto:vikatechit@gmail.com) · [Instagram](https://www.instagram.com/vikatechit)
