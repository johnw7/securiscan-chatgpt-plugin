import { describe, expect, it } from "vitest";
import { conformityByCategory, DEFAULT_SCORING, parseScoring, riskLevel, riskScore, clampToScale } from "@/features/audit/scoring";
import { DEFAULT_QUESTIONS } from "@/features/audit/default-template";
import { rankOffers, suggestedPriceScore, weightedScore } from "@/features/project/comparison";
import { QUESTIONS, scoreProtect } from "@/features/protect/questionnaire";
import { parseFeed, stripHtml } from "@/features/intelligence/feed";

describe("AUDIT — cotation configurable", () => {
  it("score = vraisemblance × gravité et niveaux par seuils", () => {
    expect(riskScore(3, 4)).toBe(12);
    expect(riskLevel(DEFAULT_SCORING, 2).label).toBe("Faible");
    expect(riskLevel(DEFAULT_SCORING, 6).label).toBe("Modéré");
    expect(riskLevel(DEFAULT_SCORING, 9).label).toBe("Élevé");
    expect(riskLevel(DEFAULT_SCORING, 16).label).toBe("Critique");
  });

  it("borne les notes à l'échelle de la méthode", () => {
    expect(clampToScale(9, DEFAULT_SCORING.likelihood)).toBe(4);
    expect(clampToScale(0, DEFAULT_SCORING.impact)).toBe(1);
  });

  it("retombe sur la méthode par défaut si la configuration est invalide", () => {
    expect(parseScoring({ likelihood: "x" }).likelihood).toEqual(DEFAULT_SCORING.likelihood);
  });

  it("couvre les 8 catégories demandées", () => {
    expect(new Set(DEFAULT_QUESTIONS.map((q) => q.category)).size).toBe(8);
  });

  it("calcule une conformité pondérée en ignorant les « non applicable »", () => {
    const qs = DEFAULT_QUESTIONS.filter((q) => q.category === "controle_acces");
    const r = conformityByCategory(qs, { [qs[0]!.id]: { value: "conforme" }, [qs[1]!.id]: { value: "partiel" }, [qs[2]!.id]: { value: "na" } });
    expect(r.controle_acces).toEqual({ answered: 3, total: 4, rate: 75 });
  });
});

describe("PROJECT — comparaison pondérée", () => {
  const criteria = [{ id: "a", label: "Technique", weight: 60 }, { id: "b", label: "Prix", weight: 40 }];
  it("note pondérée normalisée et complétude", () => {
    expect(weightedScore({ scores: { a: 10, b: 5 } }, criteria)).toEqual({ value: 8, complete: true });
    expect(weightedScore({ scores: { a: 10 } }, criteria).complete).toBe(false);
  });
  it("classe les offres et départage au prix", () => {
    const ranked = rankOffers(
      [
        { id: "1", vendor: "A", amount_ht: 1000, delay_weeks: 4, scores: { a: 8, b: 8 } },
        { id: "2", vendor: "B", amount_ht: 900, delay_weeks: 4, scores: { a: 8, b: 8 } },
        { id: "3", vendor: "C", amount_ht: 800, delay_weeks: 4, scores: { a: 5, b: 9 } },
      ],
      criteria,
    );
    expect(ranked.map((r) => r.vendor)).toEqual(["B", "A", "C"]);
    expect(suggestedPriceScore(1000, 800)).toBe(8);
  });
});

describe("PROTECT — diagnostic indicatif", () => {
  it("donne 100 si toutes les bonnes pratiques sont en place", () => {
    const all = Object.fromEntries(QUESTIONS.commerce.map((q) => [q.id, "oui" as const]));
    const r = scoreProtect("commerce", all);
    expect(r.score).toBe(100);
    expect(r.level).toBe("satisfaisant");
    expect(r.recommendations).toHaveLength(0);
  });
  it("priorise les recommandations des points lourds non couverts", () => {
    const r = scoreProtect("particulier", Object.fromEntries(QUESTIONS.particulier.map((q) => [q.id, "non" as const])));
    expect(r.score).toBe(0);
    expect(r.level).toBe("a_renforcer");
    expect(r.recommendations[0]!.priority).toBe("haute");
  });
  it("traite l'absence de réponse comme une incertitude", () => {
    expect(scoreProtect("petite_entreprise", {}).score).toBe(25);
  });
});

describe("INTELLIGENCE — flux", () => {
  it("lit un flux RSS et ne garde que titre, lien, date, extrait", () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>Alerte &amp; info</title><link>https://exemple.test/a</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate><description>&lt;p&gt;Texte &lt;script&gt;x&lt;/script&gt;résumé&lt;/p&gt;</description></item><item><title>Sans lien</title><link>javascript:alert(1)</link></item></channel></rss>`;
    const items = parseFeed(xml);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ title: "Alerte & info", url: "https://exemple.test/a", published_at: "2026-11-02T10:00:00.000Z" });
    expect(items[0]!.excerpt).not.toContain("<");
  });
  it("lit un flux Atom", () => {
    const xml = `<feed><entry><title>Atom</title><link rel="alternate" href="https://exemple.test/b"/><updated>2026-11-01T00:00:00Z</updated><summary>Résumé</summary></entry></feed>`;
    expect(parseFeed(xml)[0]).toMatchObject({ title: "Atom", url: "https://exemple.test/b" });
  });
  it("retire le HTML actif", () => {
    expect(stripHtml("<b>a</b><script>alert(1)</script> b")).toBe("a b");
  });
});
