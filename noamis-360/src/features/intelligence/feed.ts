import { XMLParser } from "fast-xml-parser";

/** Extraction minimale des entrées d'un flux RSS 2.0 ou Atom (titre, lien, date, extrait). */
export type FeedEntry = { title: string; url: string; published_at: string | null; excerpt: string | null };

const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");

export function stripHtml(html: string): string {
  // Décodage AVANT suppression : neutralise aussi le HTML encodé en entités.
  const strip = (s: string) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]*>/g, " ");
  return strip(decode(strip(html))).replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
}

const text = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)["#text"]);
  return "";
};

const asArray = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function isoDate(v: string): string | null {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function parseFeed(xml: string, limit = 30): FeedEntry[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", processEntities: false, htmlEntities: false });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const out: FeedEntry[] = [];
  const rss = (doc.rss as Record<string, unknown> | undefined)?.channel as Record<string, unknown> | undefined;
  if (rss) {
    for (const item of asArray(rss.item as Record<string, unknown> | Array<Record<string, unknown>>)) {
      const url = text(item.link).trim();
      if (!/^https?:\/\//.test(url)) continue;
      out.push({
        title: stripHtml(text(item.title)).slice(0, 300) || "(sans titre)",
        url,
        published_at: isoDate(text(item.pubDate) || text(item["dc:date"])),
        excerpt: stripHtml(text(item.description)).slice(0, 1000) || null,
      });
    }
  }
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) {
    for (const entry of asArray(feed.entry as Record<string, unknown> | Array<Record<string, unknown>>)) {
      const links = asArray(entry.link as Record<string, unknown> | Array<Record<string, unknown>>);
      const link = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
      const url = String(link?.["@_href"] ?? "").trim();
      if (!/^https?:\/\//.test(url)) continue;
      out.push({
        title: stripHtml(text(entry.title)).slice(0, 300) || "(sans titre)",
        url,
        published_at: isoDate(text(entry.updated) || text(entry.published)),
        excerpt: stripHtml(text(entry.summary) || text(entry.content)).slice(0, 1000) || null,
      });
    }
  }
  return out.slice(0, limit);
}
