import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: {
    default: "E-DUST INTERVENTION",
    template: "%s · E-DUST INTERVENTION",
  },
  description:
    "Démonstrateur E-DUST Solutions : application métier de gestion des interventions, du planning et des techniciens terrain pour TPE/PME.",
  applicationName: "E-DUST INTERVENTION",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#021448",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
