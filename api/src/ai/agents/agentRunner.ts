import { makePlan } from "./planner";
import { executeStep } from "./executor";
import { needsApproval } from "./approvals";

export async function runAgent(params: { goal: string; userCtx: any }) {
  const plan = await makePlan(params.goal);

  const results: any[] = [];
  for (const step of plan.steps) {
    if (needsApproval(step)) {
      results.push({ step, status: "pending_approval", message: "Requires approval (modifies data)." });
      continue;
    }
    const res = await executeStep(step, params.userCtx);
    results.push({ step, status: "executed", res });
  }

  return { plan, results };
}
