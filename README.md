# LifeOS — Deploy to iPhone via GitHub Pages

## What this gives you
- LifeOS hosted at `https://YOUR_USERNAME.github.io/lifeos/`
- Installs on iPhone home screen as a real app (no App Store needed)
- Works fully offline after first load
- Auto-deploys every time you push a change

---

## Step 1 — Create a GitHub account
Go to **github.com** → Sign Up (free)

---

## Step 2 — Create a new repository
1. Click the **+** icon top right → **New repository**
2. Name it exactly: `lifeos`
3. Set to **Public** (required for free GitHub Pages)
4. Click **Create repository**

---

## Step 3 — Upload your files
On the repository page, click **uploading an existing file** and upload ALL files from this folder maintaining the folder structure:

```
lifeos/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── LifeOS.jsx        ← your main app file
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/            ← see Step 4
│       ├── icon-192.png
│       ├── icon-512.png
│       ├── icon-180.png
│       ├── icon-152.png
│       └── icon-120.png
└── .github/
    └── workflows/
        └── deploy.yml
```

**Tip:** Use GitHub Desktop app (free, Windows) to drag-and-drop the whole folder — much easier than the web UI.

---

## Step 4 — Create your icons
You need PNG icon files. Easiest way:

1. Go to **https://realfavicongenerator.net**
2. Upload any square image (your logo, or just a ⚡ emoji screenshot)
3. Download the package
4. Rename/resize to: `icon-120.png`, `icon-152.png`, `icon-180.png`, `icon-192.png`, `icon-512.png`
5. Put them in the `public/icons/` folder

**Quickest option:** Take a screenshot of the LifeOS purple logo on your phone, crop to square, upload to realfavicongenerator.

---

## Step 5 — Enable GitHub Pages
1. Go to your repo → **Settings** → **Pages** (left sidebar)
2. Under **Source** → select **GitHub Actions**
3. Save

---

## Step 6 — Wait for deployment
Go to the **Actions** tab in your repo.
You'll see a workflow running (orange dot). Wait ~2 minutes for it to finish (green tick).

Your app is now live at:
**`https://YOUR_USERNAME.github.io/lifeos/`**

---

## Step 7 — Install on iPhone
1. Open Safari on your iPhone
2. Go to `https://YOUR_USERNAME.github.io/lifeos/`
3. Tap the **Share** button (box with arrow)
4. Tap **Add to Home Screen**
5. Tap **Add**

Done. LifeOS now lives on your home screen, works offline, and has no white edges.

---

## Step 8 — Update the app
Whenever I give you a new `LifeOS.jsx`:
1. Replace the file in your repo (via GitHub Desktop or the web UI → click file → pencil icon)
2. Commit the change
3. GitHub Actions automatically rebuilds and deploys in ~2 minutes
4. Refresh the app on your phone (pull down in the app to reload, or close and reopen)

---

## Your data
All your data is stored in **localStorage on your iPhone** — it stays there permanently between sessions, just like the local version. It won't sync to other devices, but it won't disappear unless you clear Safari's website data.

---

## If the build fails
Check the **Actions** tab → click the failed run → read the error. Most common issues:
- Missing icon files in `public/icons/`
- Typo in `vite.config.js` base path (must match your repo name exactly)
