# Deploying NIAT Growth Engine to Render (Step-by-Step Guide)

This application is 100% cloud-ready and designed for zero-friction deployment on [Render](https://render.com).

---

## Quick 3-Minute Deployment Steps

### Option A: 1-Click Blueprint (Recommended)
1. Push this repository to GitHub or GitLab.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** $\rightarrow$ **Blueprint**.
4. Connect your repository. Render will automatically detect [`render.yaml`](file:///c:/Users/ASUS/Desktop/nextwave/render.yaml).
5. Add the environment variables:
   * `GEMINI_API_KEY`: Your Gemini API Key
   * `TELEGRAM_BOT_TOKEN` *(optional)*: Your Bot Token from `@BotFather`
6. Click **Apply**. Your app will build and go live on an `onrender.com` URL.

---

### Option B: Manual Web Service Setup
1. On Render Dashboard, click **New +** $\rightarrow$ **Web Service**.
2. Connect your Git repository.
3. Configure the following fields:
   * **Name:** `niat-call-to-close-engine`
   * **Runtime:** `Node`
   * **Region:** Singapore / Frankfurt / Oregon
   * **Branch:** `main` (or `master`)
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
4. Under **Environment Variables**, add:
   * `PORT`: `10000` (Render assigns this automatically, but good to specify)
   * `GEMINI_API_KEY`: `<your_gemini_api_key>`
   * `TELEGRAM_BOT_TOKEN`: `<your_telegram_bot_token>` *(optional)*
5. Click **Create Web Service**.

---

## Verifying Deployment
Once the build completes:
* **Track B (Sales Co-Pilot & Audio Engine):** `https://<your-app>.onrender.com/call-to-close.html`
* **Track A (Top-of-Funnel Career DNA):** `https://<your-app>.onrender.com/`
* **API Health Check:** `https://<your-app>.onrender.com/api/health`
* **Download Sample Audio:** `https://<your-app>.onrender.com/api/samples/list`
