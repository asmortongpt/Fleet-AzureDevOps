export type UserContext = {
  userId: string;
  orgId: string;
  roles: string[];
  permissions: string[];
};

export type AIPolicyDecision = {
  allow: boolean;
  reason?: string;
  allowedTools?: string[];
};

export function enforceAIPolicy(
  user: UserContext,
  request: { intent: string; toolsRequested?: string[] }
): AIPolicyDecision {
  const isAdmin = user.roles.includes("admin");
  const isOps = user.roles.includes("ops") || user.roles.includes("fleet_manager");

  const allowedTools =
    request.toolsRequested?.filter((tool) => {
      if (tool.startsWith("docs.")) return true;
      if (tool.startsWith("policy.")) return true;
      if (tool.startsWith("fleet.")) return isOps || isAdmin;
      return isAdmin;
    }) ?? [];

  return { allow: true, allowedTools };
}
