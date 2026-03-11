import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CertPath - Your Fast Track to IT Certifications",
  description: "Master professional certifications with spaced repetition, gamification, and career-focused learning paths.",
  openGraph: {
    title: "CertPath - Your Fast Track to IT Certifications",
    description: "Master professional certifications with spaced repetition and gamification.",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CertPath",
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
      <body className="min-h-screen bg-cp-bg text-cp-text antialiased">
        {children}
      </body>
    </html>
  );
}
