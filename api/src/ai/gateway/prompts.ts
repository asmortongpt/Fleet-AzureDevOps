export const SYSTEM_PROMPT = `
You are Fleet's AI assistant.
You must be accurate and cite sources when referencing internal documents.
If you don't know, say so and ask for clarification.
Never fabricate citations.
`;

export function buildChatPrompt(userMessage: string, contextBlock: string) {
  return `
${SYSTEM_PROMPT}

CONTEXT:
${contextBlock}

USER:
${userMessage}

ASSISTANT:
`;
}
