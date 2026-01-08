import { MCPServer } from "../types";
import { db } from "../../../db"; // adjust
import { sql } from "drizzle-orm";

export const documentsMcpServer: MCPServer = {
  namespace: "docs",
  listTools() {
    return ["search", "getDocument"];
  },
  async call(toolName, args, userCtx) {
    const orgId = userCtx.orgId;
    if (toolName === "search") {
      const q = String(args.query ?? "").trim();
      if (!q) return { ok: true, result: { matches: [] } };

      const rows = await db.execute(sql`
        SELECT id, title, source, doc_type, version
        FROM ai_documents
        WHERE org_id = ${orgId} AND is_active = true AND title ILIKE ${"%" + q + "%"}
        ORDER BY updated_at DESC
        LIMIT 10
      `);
      const r = (rows as any).rows ?? rows ?? [];
      return { ok: true, result: { matches: r } };
    }

    if (toolName === "getDocument") {
      const id = String(args.id ?? "");
      const rows = await db.execute(sql`
        SELECT *
        FROM ai_documents
        WHERE org_id = ${orgId} AND id = ${id}
        LIMIT 1
      `);
      const r = (rows as any).rows ?? rows ?? [];
      return { ok: true, result: r[0] ?? null };
    }

    return { ok: false, error: `Unknown tool: ${toolName}` };
  },
};
