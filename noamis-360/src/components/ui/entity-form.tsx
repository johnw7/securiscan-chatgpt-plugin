"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { FORM_SCHEMAS, type SchemaKey } from "@/features/form-schemas";
import type { ActionResult } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { Field } from "./field";
import { Checkbox, Input, Select, Textarea } from "./input";
import { toast } from "./toaster";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "date" | "datetime-local" | "textarea" | "select" | "checkbox" | "password";
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  wide?: boolean;
  rows?: number;
  step?: string;
  min?: number;
  max?: number;
  autoComplete?: string;
};

type Props = {
  schema: SchemaKey;
  fields: FieldConfig[];
  defaultValues?: Record<string, unknown>;
  action: (values: unknown) => Promise<ActionResult<{ id?: string } | undefined>>;
  submitLabel?: string;
  successMessage?: string;
  /** Redirection après succès ; `:id` est remplacé par l'identifiant renvoyé. */
  redirectTo?: string;
  onSuccess?: (result: { id?: string } | undefined) => void;
  hidden?: Record<string, unknown>;
  className?: string;
  columns?: 1 | 2;
};

/**
 * Formulaire générique : validation Zod côté client (confort) ET côté serveur
 * (sécurité, dans la Server Action), affichage accessible des erreurs.
 */
export function EntityForm({
  schema,
  fields,
  defaultValues,
  action,
  submitLabel = "Enregistrer",
  successMessage = "Enregistré",
  redirectTo,
  onSuccess,
  hidden,
  className,
  columns = 2,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const form = useForm<FieldValues>({
    // Le schéma est générique : on accepte ses entrées/sorties sans contrainte de type ici.
    resolver: zodResolver(FORM_SCHEMAS[schema] as never) as never,
    defaultValues: normalizeDefaults(fields, defaultValues),
    mode: "onTouched",
  });
  const errors = form.formState.errors;

  const submit = form.handleSubmit((values) =>
    startTransition(async () => {
      const result = await action({ ...values, ...hidden });
      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [name, messages] of Object.entries(result.fieldErrors)) {
            form.setError(name, { message: messages[0] });
          }
        }
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? successMessage);
      onSuccess?.(result.data);
      if (redirectTo) router.push(redirectTo.replace(":id", result.data?.id ?? ""));
      else router.refresh();
    }),
  );

  return (
    <form onSubmit={submit} className={cn("space-y-5", className)} noValidate>
      <div className={cn("grid gap-4", columns === 2 && "sm:grid-cols-2")}>
        {fields.map((f) => {
          const id = `f-${f.name}`;
          const error = errors[f.name]?.message as string | undefined;
          const reg = form.register(f.name);
          let control: React.ReactElement<Record<string, unknown>>;
          switch (f.type) {
            case "textarea":
              control = <Textarea {...reg} rows={f.rows ?? 4} placeholder={f.placeholder} />;
              break;
            case "select":
              control = <Select {...reg} options={f.options ?? []} placeholder={f.required ? undefined : "—"} />;
              break;
            case "checkbox":
              return (
                <div key={f.name} className={cn("flex items-start gap-2.5 pt-1", (f.wide || columns === 1) && "sm:col-span-2")}>
                  <Checkbox id={id} {...reg} aria-describedby={f.hint ? `${id}-hint` : undefined} className="mt-0.5" />
                  <div>
                    <label htmlFor={id} className="text-sm">
                      {f.label}
                    </label>
                    {f.hint && (
                      <p id={`${id}-hint`} className="text-xs text-muted">
                        {f.hint}
                      </p>
                    )}
                  </div>
                </div>
              );
            default:
              control = (
                <Input
                  {...reg}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  autoComplete={f.autoComplete}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                />
              );
          }
          return (
            <Field
              key={f.name}
              id={id}
              label={f.label}
              hint={f.hint}
              error={error}
              required={f.required}
              className={cn((f.wide || f.type === "textarea") && "sm:col-span-2")}
            >
              {control}
            </Field>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function normalizeDefaults(fields: FieldConfig[], values?: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values?.[f.name];
    if (f.type === "checkbox") out[f.name] = Boolean(v);
    else if (v === null || v === undefined) out[f.name] = "";
    else if (f.type === "datetime-local" && typeof v === "string") out[f.name] = v.slice(0, 16);
    else out[f.name] = String(v);
  }
  return out;
}

/** Formulaire dans une fenêtre modale (création / modification rapide). */
export function FormDialog({
  trigger,
  title,
  description,
  size,
  ...formProps
}: Props & { trigger: React.ReactNode; title: string; description?: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen} trigger={trigger} title={title} description={description} size={size}>
      <EntityForm
        {...formProps}
        onSuccess={(r) => {
          setOpen(false);
          formProps.onSuccess?.(r);
        }}
      />
    </Dialog>
  );
}
