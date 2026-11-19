import type { NextConfig } from "next";

/**
 * Configuration Next.js de NOAMIS 360°.
 * - Rendu dynamique (application authentifiée) : cacheComponents désactivé
 *   (voir docs/DECISIONS.md, ADR-004).
 * - En-têtes de sécurité appliqués à toutes les réponses ; la CSP à nonce
 *   est générée par requête dans src/proxy.ts.
 */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  // Le dépôt contient un autre projet à la racine : on fixe la racine de ce projet.
  outputFileTracingRoot: process.cwd(),
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
