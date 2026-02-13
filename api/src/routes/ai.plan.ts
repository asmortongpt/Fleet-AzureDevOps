import { Response } from 'express'
import { initAIPlatform } from "../ai";
import { runAgent } from "../ai/agents/agentRunner";
import { AuthRequest } from '../middleware/auth';

export async function aiPlanRoute(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  initAIPlatform();
  const { goal } = req.body ?? {};

  const userCtx = {
    userId: req.user.id,
    orgId: req.user.org_id ?? req.user.id,
    roles: req.user.role ? [req.user.role] : [],
    permissions: req.user.permissions ?? [],
  };

  const result = await runAgent({ goal, userCtx });
  res.status(200).json(result);
}
