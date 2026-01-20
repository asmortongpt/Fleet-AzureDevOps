import { pool } from "../../../db"; // adjust
import { MCPServer } from "../types";

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

      const rows = await pool.query(
        `SELECT id, title, source, doc_type, version
         FROM ai_documents
         WHERE org_id = $1 AND is_active = true AND title ILIKE $2
         ORDER BY updated_at DESC
         LIMIT 10`,
        [orgId, "%" + q + "%"]
      );
      return { ok: true, result: { matches: rows.rows } };
    }

    if (toolName === "getDocument") {
      const id = String(args.id ?? "");
      const rows = await pool.query(
        `SELECT *
         FROM ai_documents
         WHERE org_id = $1 AND id = $2
         LIMIT 1`,
        [orgId, id]
      );
      return { ok: true, result: rows.rows[0] ?? null };
    }

    return { ok: false, error: `Unknown tool: ${toolName}` };
  },
};
