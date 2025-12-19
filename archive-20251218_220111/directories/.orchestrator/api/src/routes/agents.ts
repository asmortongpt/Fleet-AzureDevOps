import { Router } from 'express';

import { query } from '../db';

const router = Router();

// Get all agents
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;

    let sql = 'SELECT * FROM agent_status';
    const params: any[] = [];

    if (active !== undefined) {
      params.push(active === 'true');
      sql += ` WHERE active = $${params.length}`;
    }

    sql += ' ORDER BY name';

    const agents = await query(sql, params);
    res.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// Get agent by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agents = await query('SELECT * FROM agent_status WHERE id = $1', [id]);

    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent: agents[0] });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// Register or update agent (heartbeat)
router.post('/heartbeat', async (req, res) => {
  try {
    const { name, llm_model, role, vm_host, vm_resource_group } = req.body;

    if (!name || !llm_model || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, llm_model, role' });
    }

    const agents = await query(`
      INSERT INTO agents (name, llm_model, role, vm_host, vm_resource_group, last_heartbeat, active)
      VALUES ($1, $2, $3, $4, $5, now(), TRUE)
      ON CONFLICT (name)
      DO UPDATE SET
        last_heartbeat = now(),
        active = TRUE,
        llm_model = EXCLUDED.llm_model,
        role = EXCLUDED.role,
        vm_host = EXCLUDED.vm_host,
        vm_resource_group = EXCLUDED.vm_resource_group
      RETURNING *
    `, [name, llm_model, role, vm_host || null, vm_resource_group || null]);

    res.json({ agent: agents[0] });
  } catch (error) {
    console.error('Error registering agent:', error);
    res.status(500).json({ error: 'Failed to register agent' });
  }
});

// Deactivate agent
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const agents = await query(`
      UPDATE agents
      SET active = FALSE, updated_at = now()
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (agents.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({ agent: agents[0] });
  } catch (error) {
    console.error('Error deactivating agent:', error);
    res.status(500).json({ error: 'Failed to deactivate agent' });
  }
});

export default router;
