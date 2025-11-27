// Generated code for: Create location broadcast service:
- Poll database for vehicle location changes (every 5 seconds)
- Detect changed locations using timestamp comparison
- Broadcast to WebSocket clients subscribed to each vehicle
- Include speed, heading, address in broadcast
- Batch updates for performance
Use Drizzle ORM with parameterized queries only.
// TODO: Implement using OpenAI Codex
