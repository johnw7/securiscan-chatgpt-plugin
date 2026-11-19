import * as React from "react";
import { cn } from "@/lib/utils";

export const controlClass =
  "w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted/70 transition-colors hover:border-border-strong focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(controlClass, "h-10", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlClass, "py-2 leading-relaxed", className)} {...props} />;
  },
);

type Option = { value: string; label: string };
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { options: Option[]; placeholder?: string }
>(function Select({ className, options, placeholder, ...props }, ref) {
  return (
    <select ref={ref} className={cn(controlClass, "h-10 pr-8", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="checkbox" className={cn("size-4 rounded border-border accent-[var(--gold)]", className)} {...props} />;
}
