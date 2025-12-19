import { Router } from 'express';

import { query } from '../db';

const router = Router();

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const { status, epic } = req.query;

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (epic) {
      params.push(epic);
      sql += ` AND epic_number = $${params.length}`;
    }

    sql += ' ORDER BY priority DESC, epic_number, issue_number';

    const tasks = await query(sql, params);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: tasks[0] });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Get tasks ready to start (no blockers)
router.get('/ready/list', async (req, res) => {
  try {
    const tasks = await query(`
      SELECT t.*
      FROM task_dependencies t
      WHERE t.ready_to_start = TRUE
        AND t.status = 'pending'
      ORDER BY t.epic_number, t.issue_number
    `);

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching ready tasks:', error);
    res.status(500).json({ error: 'Failed to fetch ready tasks' });
  }
});

// Update task progress
router.patch('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { percent_complete, status, actual_hours } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (percent_complete !== undefined) {
      params.push(percent_complete);
      updates.push(`percent_complete = $${params.length}`);
    }

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);
    }

    if (actual_hours !== undefined) {
      params.push(actual_hours);
      updates.push(`actual_hours = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const sql = `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING *
    `;

    const tasks = await query(sql, params);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: tasks[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task branch and PR
router.patch('/:id/git', async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_name, pr_url } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (branch_name) {
      params.push(branch_name);
      updates.push(`branch_name = $${params.length}`);
    }

    if (pr_url) {
      params.push(pr_url);
      updates.push(`pr_url = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const sql = `
      UPDATE tasks
      SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING *
    `;

    const tasks = await query(sql, params);

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: tasks[0] });
  } catch (error) {
    console.error('Error updating task Git info:', error);
    res.status(500).json({ error: 'Failed to update task Git info' });
  }
});

export default router;
