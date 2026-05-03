// Strip CR/LF and other control chars from values before they enter audit
// log lines. Untrusted upstream messages (Stripe error.message, Supabase
// error.message, third-party email API responses) can contain newline
// characters that fool log analyzers / log drains into seeing fake log
// entries. Centralised so every [audit] line gets the same scrub.

const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]", "g");

export function safeLogValue(value: unknown, maxLen = 500): string {
  const s = value instanceof Error ? value.message : typeof value === "string" ? value : String(value);
  return s.replace(CONTROL_CHARS, " ").slice(0, maxLen);
}
