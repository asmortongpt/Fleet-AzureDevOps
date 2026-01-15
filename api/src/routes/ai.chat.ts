import { initAIPlatform } from "../ai";
import { chatWithAI } from "../ai/gateway/aiGateway";

/**
 * Example route handler (Express/Fastify compatible signature).
 * Replace with your actual router framework.
 */
export async function aiChatRoute(req: any, res: any) {
  initAIPlatform();
  const { message } = req.body ?? {};

  // TODO: replace with real auth context
  const user = {
    userId: req.user?.id ?? "demo-user",
    orgId: req.user?.orgId ?? "demo-org",
    roles: req.user?.roles ?? ["fleet_manager"],
    permissions: req.user?.permissions ?? ["ai.chat"],
  };

  const result = await chatWithAI({ user, message, enableRag: true });
  res.status(200).json(result);
}
