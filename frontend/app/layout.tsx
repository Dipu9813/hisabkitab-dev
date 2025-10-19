import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NetworkGate from "@/components/NetworkGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HisabKitab",
  description: "Smart Lending. Simple Tracking.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HisabKitab",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "HisabKitab",
    title: "HisabKitab - Smart Lending Tracker",
    description:
      "Smart Lending. Simple Tracking. Manage your loans and expenses efficiently.",
  },
  twitter: {
    card: "summary",
    title: "HisabKitab - Smart Lending Tracker",
    description:
      "Smart Lending. Simple Tracking. Manage your loans and expenses efficiently.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="HisabKitab" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HisabKitab" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="none" />
        <meta name="msapplication-TileColor" content="#4F46E5" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png" />

        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icon.png" color="#4F46E5" />
        <link rel="shortcut icon" href="/favicon.png" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourdomain.com" />
        <meta name="twitter:title" content="HisabKitab" />
        <meta
          name="twitter:description"
          content="Smart Lending. Simple Tracking."
        />        <meta name="twitter:image" content="/icon-192x192.png" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="HisabKitab" />
        <meta
          property="og:description"
          content="Smart Lending. Simple Tracking."
        />
        <meta property="og:site_name" content="HisabKitab" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta property="og:image" content="/icon-192x192.png" />
        
        {/* Script to remove development indicators */}
        <script src="/remove-dev-indicators.js" defer></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NetworkGate>
          {children}
        </NetworkGate>
      </body>
    </html>
  );
}
