import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env.server";

/**
 * Connecteur IA optionnel (désactivé si ANTHROPIC_API_KEY est absente).
 * Il produit uniquement des BROUILLONS, identifiés comme générés par IA,
 * à valider par un analyste avant toute diffusion. Seuls des titres, liens,
 * dates et extraits de sources publiques lui sont transmis — jamais de
 * données clients.
 */
export function aiConnectorStatus(): { enabled: boolean; model: string } {
  const env = serverEnv();
  return { enabled: Boolean(env.ANTHROPIC_API_KEY), model: env.ANTHROPIC_MODEL };
}

export type AiSource = { title: string; url: string; date: string | null; source: string; reliability: string; excerpt: string | null };

const SYSTEM = `Tu es analyste en veille de sûreté pour un cabinet de conseil français indépendant.
Rédige en français une synthèse de veille sobre et factuelle à partir UNIQUEMENT des éléments fournis.
Règles :
- Distingue explicitement les faits rapportés par les sources, les éléments à confirmer et les hypothèses.
- N'invente aucun fait, chiffre ou source ; ne présente pas une hypothèse comme une menace avérée.
- Cite les sources entre crochets par leur numéro, par exemple [2], après chaque information.
- Évite le sensationnalisme et les alertes inutiles ; indique les limites de l'analyse.
- Structure : 1) Synthèse en 3 à 5 phrases ; 2) Points clés (puces) ; 3) Éléments à confirmer ; 4) Recommandations de vigilance générales.`;

export async function draftSynthesis(topic: string, sources: AiSource[]): Promise<{ text: string; model: string }> {
  const env = serverEnv();
  if (!env.ANTHROPIC_API_KEY) throw new Error("AI_DISABLED");
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const list = sources
    .map((s, i) => `[${i + 1}] ${s.title}\nSource : ${s.source} (fiabilité ${s.reliability}) — ${s.date ?? "date inconnue"}\nURL : ${s.url}\nExtrait : ${s.excerpt ?? "—"}`)
    .join("\n\n");
  const response = await client.beta.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: SYSTEM,
    messages: [{ role: "user", content: `Sujet de la fiche : ${topic}\n\nÉléments collectés :\n\n${list}` }],
  });
  if (response.stop_reason === "refusal") throw new Error("AI_REFUSED");
  const textOut = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!textOut) throw new Error("AI_EMPTY");
  return { text: textOut, model: response.model };
}
