export type AgentPlanStep = {
  id: string;
  description: string;
  toolCall?: { tool: string; args: any };
  requiresApproval?: boolean;
};

export type AgentPlan = {
  goal: string;
  steps: AgentPlanStep[];
};
