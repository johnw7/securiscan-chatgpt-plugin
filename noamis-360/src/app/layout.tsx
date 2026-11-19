import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" });

export const metadata: Metadata = {
  title: { default: "NOAMIS 360°", template: "%s · NOAMIS 360°" },
  description: "Plateforme de pilotage NOAMIS Sûreté Conseil : missions, audits de sûreté, AMOA, veille, documents et portail client.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#101113",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = (await cookies()).get("noamis-theme")?.value === "light" ? "light" : "dark";
  await headers(); // rendu dynamique : nécessaire à la CSP à nonce
  return (
    <html lang="fr" data-theme={theme} className={`${inter.variable} ${cormorant.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <a
          href="#contenu"
          className="sr-only z-[100] rounded-md bg-gold px-4 py-2 text-on-gold focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Aller au contenu
        </a>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
