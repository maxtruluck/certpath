import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "openED — The Learning Engine That Makes Education Stick",
  description: "Adaptive learning with spaced repetition, gamification, and a creator marketplace. Free to learn. Fair to create. Built to last.",
  openGraph: {
    title: "openED — The Learning Engine That Makes Education Stick",
    description: "Adaptive learning with spaced repetition and a creator marketplace.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "openED",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="touch-manipulation">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
