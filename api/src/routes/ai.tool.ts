import { Response } from 'express'
import { initAIPlatform } from "../ai";
import { enforceAIPolicy } from "../ai/gateway/policy";
import { callTool } from "../ai/mcp/toolRouter";
import { AuthRequest } from '../middleware/auth';

export async function aiToolRoute(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  initAIPlatform();
  const { tool, args } = req.body ?? {};

  const user = {
    userId: req.user.id,
    orgId: req.user.org_id ?? req.user.id,
    roles: req.user.role ? [req.user.role] : [],
    permissions: req.user.permissions ?? [],
  };

  const policy = enforceAIPolicy(user, { intent: "tool", toolsRequested: [tool] });
  if (!policy.allow || !policy.allowedTools?.includes(tool)) {
    res.status(403).json({ ok: false, error: "Tool not allowed by policy." });
    return;
  }

  const out = await callTool(tool, args ?? {}, user);
  res.status(200).json(out);
}
