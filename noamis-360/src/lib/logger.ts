/**
 * Journalisation applicative avec masquage systématique des secrets.
 * Ne jamais journaliser de mot de passe, jeton, cookie ou clé.
 */
const SENSITIVE_KEYS = /pass(word)?|token|secret|authorization|cookie|api[-_]?key|service[-_]?role|otp|code_verifier|refresh|access/i;
const SENSITIVE_VALUES = [
  /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, // JWT
  /sb_(secret|publishable)_[A-Za-z0-9_-]+/g, // clés Supabase
  /sk-ant-[A-Za-z0-9_-]+/g, // clés Anthropic
  /Bearer\s+[A-Za-z0-9._-]+/gi,
];

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[…]";
  if (typeof value === "string") {
    return SENSITIVE_VALUES.reduce((acc, re) => acc.replace(re, "[MASQUÉ]"), value);
  }
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Error) return { name: value.name, message: redact(value.message, depth + 1) };
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, SENSITIVE_KEYS.test(k) ? "[MASQUÉ]" : redact(v, depth + 1)]),
    );
  }
  return value;
}

type Level = "info" | "warn" | "error";
function log(level: Level, event: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, at: new Date().toISOString(), ...(context ? { context: redact(context) } : {}) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => log("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => log("error", event, context),
};
