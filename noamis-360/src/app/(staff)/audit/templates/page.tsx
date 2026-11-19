import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FormDialog } from "@/components/ui/entity-form";
import { EmptyState, Notice, PageHeader } from "@/components/ui/misc";
import { saveTemplate } from "@/features/audit/actions";
import { DEFAULT_TEMPLATE } from "@/features/audit/default-template";
import { parseScoring, type Question } from "@/features/audit/scoring";
import { requireCapability } from "@/lib/auth/session";
import type { FieldConfig } from "@/components/ui/entity-form";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Modèles d'audit" };

const fields: FieldConfig[] = [
  { name: "name", label: "Nom du modèle", required: true, wide: true },
  { name: "description", label: "Description", type: "textarea", rows: 2 },
  { name: "is_active", label: "Modèle actif (proposé à la création d'un audit)", type: "checkbox" },
  {
    name: "questions_json", label: "Questions (JSON)", type: "textarea", rows: 14, required: true,
    hint: "Liste d'objets { id, category, label, guidance?, weight? }. Catégories conseillées : controle_acces, protection_perimetrique, videoprotection, detection_intrusion, organisation_procedures, gestion_visiteurs, protection_actifs, continuite_activite.",
  },
  {
    name: "scoring_json", label: "Méthode de cotation (JSON)", type: "textarea", rows: 12, required: true,
    hint: "Échelles de vraisemblance et de gravité (libellés), seuils de niveaux (tone : success | gold | warning | danger) et critères d'appréciation.",
  },
];

export default async function TemplatesPage() {
  await requireCapability("audit.templates.manage");
  const supabase = await createClient();
  const { data } = await supabase.from("audit_templates").select("*").order("created_at");
  return (
    <>
      <PageHeader
        eyebrow="NOAMIS AUDIT"
        title="Modèles de questionnaires"
        description="Questionnaires personnalisables et méthode de cotation configurable. Toute modification crée une nouvelle version ; un audit validé conserve la méthode en vigueur lors de sa validation."
        actions={
          <FormDialog
            title="Nouveau modèle"
            size="xl"
            trigger={<Button><Plus /> Nouveau modèle</Button>}
            schema="template"
            fields={fields}
            defaultValues={{
              name: "Nouveau modèle", is_active: true,
              questions_json: JSON.stringify(DEFAULT_TEMPLATE.questions, null, 2),
              scoring_json: JSON.stringify(DEFAULT_TEMPLATE.scoring, null, 2),
            }}
            action={saveTemplate}
          />
        }
      />
      <div className="mb-6"><Notice tone="info">Les modèles sont des outils de travail ; les questions par défaut constituent une base générique à adapter à chaque contexte (commerce, site industriel, domicile, collectivité…).</Notice></div>
      {data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((tpl) => {
            const questions = (Array.isArray(tpl.questions) ? tpl.questions : []) as Question[];
            const method = parseScoring(tpl.scoring);
            return (
              <Card key={tpl.id}>
                <CardHeader
                  title={tpl.name}
                  description={`Version ${tpl.version} · mis à jour le ${formatDate(tpl.updated_at)}`}
                  action={
                    <>
                      <Badge tone={tpl.is_active ? "success" : "neutral"}>{tpl.is_active ? "Actif" : "Inactif"}</Badge>
                      <FormDialog
                        title="Modifier le modèle"
                        size="xl"
                        trigger={<Button size="sm" variant="secondary">Modifier</Button>}
                        schema="template"
                        fields={fields}
                        defaultValues={{ ...tpl, questions_json: JSON.stringify(tpl.questions, null, 2), scoring_json: JSON.stringify(tpl.scoring, null, 2) }}
                        hidden={{ id: tpl.id }}
                        action={saveTemplate}
                      />
                    </>
                  }
                />
                <CardBody className="text-sm text-muted">
                  <p>{tpl.description}</p>
                  <p className="mt-2">{questions.length} questions · {new Set(questions.map((q) => q.category)).size} catégories</p>
                  <p className="mt-1">Cotation : {method.name} — niveaux {method.levels.map((l) => l.label).join(", ")}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aucun modèle" description="Créez un modèle à partir du questionnaire NOAMIS par défaut." />
      )}
    </>
  );
}
