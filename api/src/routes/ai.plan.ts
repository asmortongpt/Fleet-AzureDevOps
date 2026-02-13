import { Request, Response } from 'express'
import { initAIPlatform } from "../ai";
import { runAgent } from "../ai/agents/agentRunner";

interface AuthRequest extends Request {
  user?: {
    id?: string
    orgId?: string
    roles?: string[]
    permissions?: string[]
  }
}

export async function aiPlanRoute(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  initAIPlatform();
  const { goal } = req.body ?? {};

  const userCtx = {
    userId: req.user.id,
    orgId: req.user.orgId ?? req.user.id,
    roles: req.user.roles ?? [],
    permissions: req.user.permissions ?? [],
  };

  const result = await runAgent({ goal, userCtx });
  res.status(200).json(result);
}
