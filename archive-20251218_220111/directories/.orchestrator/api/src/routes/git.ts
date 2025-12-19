import { Router } from 'express';

import { query } from '../db';

const router = Router();

// Get merge queue
router.get('/merge-queue', async (req, res) => {
  try {
    const tasks = await query(`
      SELECT
        t.*,
        a.name as assigned_agent
      FROM tasks t
      LEFT JOIN assignments asg ON t.id = asg.task_id AND asg.status = 'in_progress'
      LEFT JOIN agents a ON asg.agent_id = a.id
      WHERE t.status IN ('review', 'done')
        AND t.pr_url IS NOT NULL
      ORDER BY t.epic_number, t.issue_number
    `);

    res.json({ queue: tasks });
  } catch (error) {
    console.error('Error fetching merge queue:', error);
    res.status(500).json({ error: 'Failed to fetch merge queue' });
  }
});

// Get active branches
router.get('/branches', async (req, res) => {
  try {
    const branches = await query(`
      SELECT DISTINCT
        t.branch_name,
        t.epic_number,
        COUNT(t.id) as task_count,
        MAX(t.updated_at) as last_updated
      FROM tasks t
      WHERE t.branch_name IS NOT NULL
        AND t.status != 'done'
      GROUP BY t.branch_name, t.epic_number
      ORDER BY t.epic_number, t.branch_name
    `);

    res.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

// Record evidence (commit, PR, etc.)
router.post('/evidence', async (req, res) => {
  try {
    const { task_id, agent_id, type, ref, summary, metadata } = req.body;

    if (!task_id || !agent_id || !type || !ref) {
      return res.status(400).json({
        error: 'Missing required fields: task_id, agent_id, type, ref'
      });
    }

    const evidence = await query(`
      INSERT INTO evidence (task_id, agent_id, type, ref, summary, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [task_id, agent_id, type, ref, summary || null, metadata || null]);

    res.json({ evidence: evidence[0] });
  } catch (error) {
    console.error('Error recording evidence:', error);
    res.status(500).json({ error: 'Failed to record evidence' });
  }
});

// Get evidence for task
router.get('/evidence/:task_id', async (req, res) => {
  try {
    const { task_id } = req.params;

    const evidence = await query(`
      SELECT
        e.*,
        a.name as agent_name
      FROM evidence e
      JOIN agents a ON e.agent_id = a.id
      WHERE e.task_id = $1
      ORDER BY e.created_at DESC
    `, [task_id]);

    res.json({ evidence });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

export default router;
