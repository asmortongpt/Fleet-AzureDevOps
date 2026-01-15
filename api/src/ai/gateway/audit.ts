export type AIAuditEvent = {
  eventType: string;
  timestamp: string;
  userId: string;
  orgId: string;
  payload: Record<string, any>;
};

export async function auditLog(event: AIAuditEvent) {
  // Replace with your pipeline (Datadog, Azure App Insights, OpenTelemetry, etc.)
  console.log("[AI_AUDIT]", JSON.stringify(event));
}
