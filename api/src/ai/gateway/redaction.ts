export function redactPII(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]")
    .replace(/\b\d{10}\b/g, "[REDACTED_PHONE]")
    // eslint-disable-next-line security/detect-unsafe-regex -- anchored bounded email pattern, no catastrophic backtracking risk
    .replace(/\b[A-Z0-9._%+-]{1,64}@[A-Z0-9-]{1,253}(?:\.[A-Z]{2,63}){1,10}\b/gi, "[REDACTED_EMAIL]");
}
