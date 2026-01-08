export function redactPII(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b\d{10}\b/g, "[REDACTED_PHONE]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]");
}
