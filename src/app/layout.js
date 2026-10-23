import { Geist, Geist_Mono } from "next/font/google";
import { SCORA_MAIN_ORIGIN } from "../constants/scoraDomains";
import FirestoreClientGuard from "../components/FirestoreClientGuard";
import PwaBoot from "../components/pwa/PwaBoot";
import { GOGO_BOOT_ERROR_GUARD } from "../lib/gogoBootErrorGuard";
import "./globals.css";

/** Capture beforeinstallprompt before React mounts — otherwise the event is lost. */
const PWA_EARLY_INSTALL_CAPTURE = `
(function(){
  try {
    if (window.__scoraInstallEarlyBound) return;
    window.__scoraInstallEarlyBound = true;
    window.__scoraDeferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      window.__scoraDeferredPrompt = e;
      try { window.dispatchEvent(new CustomEvent('scora-can-install')); } catch (_) {}
    });
    window.addEventListener('appinstalled', function () {
      window.__scoraDeferredPrompt = null;
      try { localStorage.setItem('scora-home-install', '1'); } catch (_) {}
      try { window.dispatchEvent(new CustomEvent('scora-installed')); } catch (_) {}
    });
  } catch (_) {}
})();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export const metadata = {
  title: "SCORA — Samsung EG",
  description: "SCORA by Samsung EG: TCS engineer rankings, PQA audits, SCORA Challenge live quizzes, the GoGo assistant and surveys. Transparent scoring based on KPIs, DRNPS, and exam performance.",
  keywords: ["SCORA", "Samsung EG", "TCS", "Technical Capability System", "PQA", "SCORA Challenge", "engineer ranking", "KPI", "DRNPS", "field engineer"],
  authors: [{ name: "Samsung Service Operations" }],
  robots: "index, follow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SCORA",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  openGraph: {
    title: "SCORA — Samsung EG",
    description: "Earn Your Tier • Own Your Title. Samsung's transparent engineering performance framework.",
    url: SCORA_MAIN_ORIGIN,
    siteName: "SCORA",
    images: [
      {
        url: `${SCORA_MAIN_ORIGIN}/sam_logo.png`,
        width: 800,
        height: 400,
        alt: "SCORA — Samsung EG",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SCORA — Samsung EG",
    description: "Earn Your Tier • Own Your Title. Samsung's engineering performance framework.",
    images: [`${SCORA_MAIN_ORIGIN}/sam_logo.png`],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SCORA" />
        <meta name="theme-color" content="#2563eb" />
        <script
          dangerouslySetInnerHTML={{ __html: PWA_EARLY_INSTALL_CAPTURE }}
        />
        <script
          // Must run before React/Firebase so Next never paints "[object Event]".
          dangerouslySetInnerHTML={{ __html: GOGO_BOOT_ERROR_GUARD }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh min-w-0 overflow-x-clip relative bg-black`}
        suppressHydrationWarning
      >
        <FirestoreClientGuard />
        <PwaBoot />
        <div className="relative z-[1] min-h-dvh min-w-0">{children}</div>
      </body>
    </html>
  );
}
