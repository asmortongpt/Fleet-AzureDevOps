import { Request, Response } from 'express'
import { initAIPlatform } from "../ai";
import { chatWithAI } from "../ai/gateway/aiGateway";

interface AuthRequest extends Request {
  user?: {
    id?: string
    orgId?: string
    roles?: string[]
    permissions?: string[]
  }
}

export async function aiChatRoute(req: AuthRequest, res: Response) {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  initAIPlatform();
  const { message } = req.body ?? {};

  const user = {
    userId: req.user.id,
    orgId: req.user.orgId ?? req.user.id,
    roles: req.user.roles ?? [],
    permissions: req.user.permissions ?? [],
  };

  const result = await chatWithAI({ user, message, enableRag: true });
  res.status(200).json(result);
}
