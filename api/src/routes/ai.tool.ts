import { initAIPlatform } from "../ai";
import { callTool } from "../ai/mcp/toolRouter";
import { enforceAIPolicy } from "../ai/gateway/policy";

export async function aiToolRoute(req: any, res: any) {
  initAIPlatform();
  const { tool, args } = req.body ?? {};

  const user = {
    userId: req.user?.id ?? "demo-user",
    orgId: req.user?.orgId ?? "demo-org",
    roles: req.user?.roles ?? ["fleet_manager"],
    permissions: req.user?.permissions ?? ["ai.tools"],
  };

  const policy = enforceAIPolicy(user, { intent: "tool", toolsRequested: [tool] });
  if (!policy.allow || !policy.allowedTools?.includes(tool)) {
    res.status(403).json({ ok: false, error: "Tool not allowed by policy." });
    return;
  }

  const out = await callTool(tool, args ?? {}, user);
  res.status(200).json(out);
}
