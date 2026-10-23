# 🚀 SCORA — Samsung EG

**SCORA** is the Samsung EG platform for engineer performance and service quality: **TCS** (Technical Capability System) engineer rankings, **PQA** audits, **SCORA Challenge** live quizzes, the **GoGo** assistant, surveys and a secure admin portal. It is built with **Next.js 16** and **Firebase**.

The TCS module is a data-driven **Engineer Performance and Ranking Platform**. It gamifies the technical excellence of field service engineers by dynamically measuring their monthly and quarterly KPIs, translating them into a unified **Technical Capability Score (TCS)**, and assigning them prestigious **Tiers**.

 *"Precision Defines Rank. Earn Your Tier • Own Your Title."*

---

## 🌟 What is this project?
The **SCORA ecosystem** replaces subjective engineer evaluations with a transparent, visually stunning, and competitive performance hub. It moves beyond standard databases to provide a dynamic, real-time leaderboard ("The Podium") and a secure administrative command center. 

By tracking core metrics—operational KPIs, Customer Satisfaction (DRNPS), and technical Exam Scores—it calculates a sophisticated **Technical Capability Score (TCS)**. This assigns engineers to dynamic tiers ranging from **Bronze** to **Masters**, while giving them a personal dashboard to trace their historical growth.

## 🛠️ Core Features
- **Public Capability Audit**: Allows engineers to verify their standing and view their detailed performance profile using unique identification codes (with robust privacy enhancements hiding codes from the public).
- **Dynamic Leaderboard**: Visualizes the top three performers on a premium "Podium" and lists all engineers in a high-impact registry, featuring seamlessly blended 3D-style tier logos optimized for dark mode.
- **Secure Management Node**: An optimized, space-efficient admin dashboard featuring:
  - **Manual Provisioning**: Adding and editing engineer records with real-time validation.
  - **Bulk Operations**: Bulk uploading engineer data via CSV templates with a newly consolidated, compact UI control grid.
  - **Asset & Document Management**: Integrated image uploading to Firebase Storage (with secure ID validation) and exporting engineer metrics to Word (.docx) and PowerPoint (.pptx).
  - **Data Archiving**: Hiding and restoring engineer records without losing historical data.
- **Advanced Analytics**: Accurately tracks application usage by strictly separating public visitor analytics from administrator session data for precise ROIs.
- **Automated Tiering**: Real-time calculation of TCS scores (out of 100) and dynamic tier assignment based on a weighted algorithm:
  - **Operational KPIs (50%)**: REDO, IQC Skip Ratio, Maintenance Mode, OQC Pass Rate, Training Attendance, Core Parts PBA, Core Parts Octa, and Multi Parts Ratio.
  - **DRNPS (30%)**: Derived from precise Promoter and Detractor feedback counts.
  - **Exam Score (20%)**.
  - **Tiers**: Bronze, Silver, Gold, Platinum, Diamond (updated assets), and Masters.

### 🏆 The Hall of Fame (Leaderboard)
- **Top 10 Podium**: Displays the absolute best engineers for any given chronological Month or correctly aggregated Quarter.
- **Visual Prestige**: Custom tier graphics (Bronze to Masters) tailored for perfect blending, alongside dynamic engineer profile photos.
- **Dynamic Periods**: Toggle smoothly between **Monthly** and aggregated **Quarterly** rankings via an intelligently sorted timeline.

### 🔍 Engineer Self-Lookup
- Engineers log in via a unique Employee Code to view their private performance report.
- Shows historical timeline navigation to see past months/quarters.
- Granular breakdown of the score: **KPIs (Max 50)**, **DRNPS (Max 30)**, and **Exam (Max 20)**.

### 🛡️ Secure Admin Portal
- **Session Management**: Secure login with 2-hour persistent sessions via `localStorage`.
- **Bulk Provisioning**: Add records manually or bulk-import via robust **CSV Parsing**.
- **Archive System**: Soft-delete ("Archive") engineer records without losing historical data, with a 1-click restore function.
- **Asset Uploads**: Direct integration with Firebase Storage to upload engineer photos natively.

### 📊 Live Analytics & Audit Logs
- **Separated Traffic Analytics**: Tracks public **Visitor** sessions (duration, daily hits) completely separately from **Admin** activity.
- **Activity Log Viewer**: A dedicated, color-coded audit log tracking admin logins, record modifications, system errors, and unhandled promise rejections directly to Firestore.

### 🎖️ The 6-Tier Gamification System
TCS Scores (0-100) automatically map to physical/digital tiers:
- 🥉 **Bronze** (0–49)
- 🥈 **Silver** (50–59)
- 🥇 **Gold** (60–69)
- 💎 **Platinum** (70–79)
- 💠 **Diamond** (80–89)
- 👑 **Masters** (90–100)

---

## 🏗️ Technology Stack
- **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Component Library**: [Ant Design 6](https://ant.design/) (Modals, Notifications, Flexible Themes)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Document Generation**: `docx` and `pptxgenjs` for automated reports.
- **Backend / Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
- **File Storage**: [Firebase Storage](https://firebase.google.com/docs/storage)
- **SEO Ready**: Configured metadata, Open Graph tags, robots.txt, and sitemap.xml.

---

## 📂 Project Structure
```text
/src
  /app           # Next.js App Router (Layouts, Pages, SEO Meta)
  /services      # Firebase Logic (firestoreService, storageService, analyticsService, auditLogService)
  /firebase.js   # Centralized Firebase Configuration
  /constants.js  # TCS Scoring Algorithm, Tier Definitions, & Global State
/public          # Static Assets (Robots, Sitemap, Favicon, CSV Templates)
/scripts         # Utilities (e.g. Word/Powerpoint generators)
```

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js (Latest LTS recommended)
- Firebase Project with Firestore & Storage enabled

### 2. Clone and Install
```bash
git clone <repository-url>
cd fawzy-project
npm install
```

### 3. Firebase Configuration
Update `src/firebase.js` with your project credentials:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```
*Note: For production deployments on Vercel/Netlify, inject these as Environment Variables (`.env.local`).*

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📈 ROI & Value Delivered
TCS replaces disjointed management spreadsheets, eliminates manual scoring errors, and drives an estimated **10x-30x ROI** through time savings and performance gamification.
