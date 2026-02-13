import { Request, Response } from 'express'
import { initAIPlatform } from "../ai";
import { enforceAIPolicy } from "../ai/gateway/policy";
import { callTool } from "../ai/mcp/toolRouter";

interface AuthRequest extends Request {
  user?: {
    id?: string
    orgId?: string
    roles?: string[]
    permissions?: string[]
  }
}

export async function aiToolRoute(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  initAIPlatform();
  const { tool, args } = req.body ?? {};

  const user = {
    userId: req.user.id,
    orgId: req.user.orgId ?? req.user.id,
    roles: req.user.roles ?? [],
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
