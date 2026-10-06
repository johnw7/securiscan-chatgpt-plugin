import type { NextConfig } from "next";

/**
 * GITHUB_PAGES=true : export statique (dossier out/) pour un hébergement sans serveur,
 * servi sous NEXT_PUBLIC_BASE_PATH (ex. /securiscan-chatgpt-plugin).
 * Sans cette variable (dev, Vercel…), l'application garde son fonctionnement serveur complet.
 */
const isStaticExport = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(isStaticExport && {
    output: "export",
    trailingSlash: true,
    basePath,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
