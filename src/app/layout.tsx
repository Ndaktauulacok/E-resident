import type { Metadata, Viewport } from "next";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "E-RESIDENT", template: "%s | E-RESIDENT" },
  description: "Sistem Pengurusan Asrama Digital",
};
export const viewport: Viewport = { themeColor: "#172036", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
