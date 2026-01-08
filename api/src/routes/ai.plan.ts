import { initAIPlatform } from "../ai";
import { runAgent } from "../ai/agents/agentRunner";

export async function aiPlanRoute(req: any, res: any) {
  initAIPlatform();
  const { goal } = req.body ?? {};

  const userCtx = {
    userId: req.user?.id ?? "demo-user",
    orgId: req.user?.orgId ?? "demo-org",
    roles: req.user?.roles ?? ["fleet_manager"],
    permissions: req.user?.permissions ?? ["ai.agent"],
  };

  const result = await runAgent({ goal, userCtx });
  res.status(200).json(result);
}
