import { callLLM } from "../gateway/modelRouter";
import { AI_CONFIG } from "../config";
import { AgentPlan } from "./types";

export async function makePlan(goal: string): Promise<AgentPlan> {
  const prompt = `
You are a workflow planner for a fleet management system.
Return JSON only.

Goal: ${goal}

Constraints:
- Prefer read-only steps unless absolutely necessary.
- If a step modifies data, mark requiresApproval=true.
- Use tools like policy.search, docs.search, fleet.listVehicles, fleet.createWorkOrder.

Return format:
{
  "goal": "...",
  "steps": [
    {
      "id": "step-1",
      "description": "...",
      "toolCall": {"tool":"docs.search","args":{"query":"..."}},
      "requiresApproval": false
    }
  ]
}
`;

  const raw = await callLLM({ model: AI_CONFIG.model, input: prompt });
  try {
    return JSON.parse(raw);
  } catch {
    return { goal, steps: [{ id: "step-1", description: "Unable to parse plan. Try again." }] };
  }
}
