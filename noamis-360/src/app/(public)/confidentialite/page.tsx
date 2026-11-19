import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <article className="prose-invert max-w-3xl space-y-5 text-sm leading-relaxed [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="font-display text-3xl font-semibold">Politique de confidentialité — NOAMIS 360°</h1>
      <p className="text-muted">Document à valider par le responsable de traitement avant mise en production (informations juridiques à compléter : adresse, contact RGPD).</p>
      <h2>Responsable de traitement</h2>
      <p>NOAMIS Sûreté Conseil (entrepreneur individuel, SIREN 907 525 158, Saint-Germain-en-Laye). Contact : contact@noamis.fr.</p>
      <h2>Diagnostic préliminaire (NOAMIS PROTECT)</h2>
      <ul>
        <li>Données : profil (particulier, commerce, entreprise), réponses au questionnaire, département facultatif. Aucune adresse n&apos;est demandée.</li>
        <li>L&apos;adresse IP n&apos;est pas conservée ; seule une empreinte cryptographique salée est utilisée pour limiter les abus (10 diagnostics par heure).</li>
        <li>Diagnostics sans demande de contact : supprimés après 12 mois (statistiques).</li>
        <li>Demande de contact : nom, e-mail et/ou téléphone, message, uniquement avec votre consentement explicite. Finalité : vous recontacter. Base légale : consentement. Conservation : 3 ans maximum après le dernier échange sans suite commerciale.</li>
      </ul>
      <h2>Espace client et espace NOAMIS</h2>
      <ul>
        <li>Données de compte (nom, e-mail), données de missions, documents et échanges. Base légale : exécution du contrat.</li>
        <li>Les documents sont stockés dans un espace privé chiffré au repos, accessibles uniquement aux personnes habilitées ; les téléchargements utilisent des liens temporaires.</li>
        <li>Les actions sensibles sont journalisées (traçabilité et sécurité).</li>
      </ul>
      <h2>Sous-traitants et hébergement</h2>
      <p>Hébergement de l&apos;application : Vercel. Base de données, authentification et stockage : Supabase (région à préciser : l&apos;Union européenne est recommandée). Connecteur d&apos;analyse IA (facultatif, désactivé par défaut) : Anthropic — seuls des contenus publics de veille lui sont transmis, jamais de données clients.</p>
      <h2>Vos droits</h2>
      <p>Accès, rectification, effacement, limitation, opposition et portabilité : contact@noamis.fr. Réclamation possible auprès de la CNIL (www.cnil.fr).</p>
      <h2>Cookies</h2>
      <p>Uniquement des cookies strictement nécessaires : session d&apos;authentification sécurisée et préférence de thème. Aucun cookie publicitaire ou de mesure d&apos;audience.</p>
    </article>
  );
}
