# e COH v2.0 - Digital Ecology Platform

**e COH** (lowercase 'e') is a full-featured Digital Ecology platform built for both Web browsers and Android 11+ devices (API level 30+).

---

## 🌟 Key Features in v2.0

1. **Direct In-App Photo Uploads (Zero External Drive Popups)**:
   - Eliminates privacy leaks where users could see each other's files in shared Google Drive folders.
   - Users capture or select project photo proof directly within the app.
   - Photos are automatically named and tagged in the format: `<User Full Name> - <Crafticle Title>`.
2. **Central Administrator Submissions & Photo Gallery**:
   - Only authenticated Administrators (`ecoh` / `ecoh@2026`) can view, inspect, and download proof photos from any device.
3. **Dynamic Rewards & Badges**:
   - Users earn Tree Points by calculating carbon footprint, taking quizzes, and completing DIY crafticles.
   - Unlock Bronze Seedling, Silver Sprout, and Gold Canopy badges with custom assigned certificates.
4. **Vercel Instant Web & APK Hosting**:
   - Serve both the web application and direct APK downloads from a single Vercel deployment.

---

## 🔐 Administrator Portal Credentials

- **Username**: `ecoh`
- **Password**: `ecoh@2026`

---

## 🚀 How to Deploy to Vercel

### Method 1: Using the `deploy-to-vercel.bat` Script (Windows)

1. Double-click `deploy-to-vercel.bat` in the `final v2.0` folder.
2. Follow the on-screen prompts to log into your Vercel account.
3. Once finished, Vercel will output a live production URL (e.g., `https://ecoh-v2.vercel.app`).

### Method 2: Command Line (Vercel CLI)

1. Open your terminal in the `final v2.0` directory.
2. Run:
   ```bash
   npm install -g vercel
   vercel --prod
   ```
3. Your deployment will be live instantly!

---

## 📱 How to Generate a QR Code for Your App

Once your site is live on Vercel (for example `https://ecoh-v2.vercel.app`), generate a free QR Code using any of the following methods:

1. **Browser Address Bar**:
   - Open your live Vercel URL in Google Chrome or Edge.
   - Click the **Share** icon in the address bar -> Select **Create QR Code**.
2. **QR Code Generator URL**:
   - Replace `YOUR_VERCEL_URL` in the link below with your actual Vercel URL:
   - `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://YOUR_VERCEL_URL`

---

## 📂 Included Build Artifacts

- `index.html`: Portal homepage with web app launch & APK download links.
- `app.html`: Core web app with dashboard, crafticles, quiz, & admin portal.
- `eCOH v2.0.apk`: Aligned & signed Android 11+ application package (APK Signature Scheme v2 & v3 verified).
- `js/db.js`: LocalStorage & Base64 photo repository database engine.
- `js/app.js`: Application logic & view controller.
- `css/styles.css`: Glassmorphism design system.
- `vercel.json`: Vercel static routing configuration.
- `deploy-to-vercel.bat`: One-click deployment script.
