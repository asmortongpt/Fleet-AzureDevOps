import { Router } from 'express';

import { query } from '../db';
import { broadcastProgress } from '../server';

const router = Router();

// Get all assignments
router.get('/', async (req, res) => {
  try {
    const { agent_id, task_id, status } = req.query;

    let sql = `
      SELECT
        a.*,
        t.title as task_title,
        t.epic_number,
        t.issue_number,
        ag.name as agent_name,
        ag.llm_model
      FROM assignments a
      JOIN tasks t ON a.task_id = t.id
      JOIN agents ag ON a.agent_id = ag.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (agent_id) {
      params.push(agent_id);
      sql += ` AND a.agent_id = $${params.length}`;
    }

    if (task_id) {
      params.push(task_id);
      sql += ` AND a.task_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    sql += ' ORDER BY a.updated_at DESC';

    const assignments = await query(sql, params);
    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Assign task to agent
router.post('/', async (req, res) => {
  try {
    const { task_id, agent_id, notes } = req.body;

    if (!task_id || !agent_id) {
      return res.status(400).json({ error: 'Missing required fields: task_id, agent_id' });
    }

    const assignments = await query(`
      INSERT INTO assignments (task_id, agent_id, status, notes, started_at)
      VALUES ($1, $2, 'in_progress', $3, now())
      ON CONFLICT (task_id, agent_id)
      DO UPDATE SET
        status = 'in_progress',
        started_at = COALESCE(assignments.started_at, now()),
        updated_at = now()
      RETURNING *
    `, [task_id, agent_id, notes || null]);

    // Update task status
    await query(`
      UPDATE tasks
      SET status = 'in_progress', updated_at = now()
      WHERE id = $1 AND status = 'pending'
    `, [task_id]);

    broadcastProgress({ type: 'assignment_created', assignment: assignments[0] });

    res.json({ assignment: assignments[0] });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment progress
router.patch('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { percent_complete, status, notes } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (percent_complete !== undefined) {
      params.push(percent_complete);
      updates.push(`percent_complete = $${params.length}`);
    }

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);

      if (status === 'done') {
        updates.push('completed_at = now()');
      }
    }

    if (notes) {
      params.push(notes);
      updates.push(`notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    params.push(id);
    const sql = `
      UPDATE assignments
      SET ${updates.join(', ')}, updated_at = now()
      WHERE id = $${params.length}
      RETURNING *
    `;

    const assignments = await query(sql, params);

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Update task status if assignment is complete
    if (status === 'done') {
      await query(`
        UPDATE tasks
        SET status = 'done', percent_complete = 100, updated_at = now()
        WHERE id = $1
      `, [assignments[0].task_id]);
    }

    broadcastProgress({ type: 'assignment_updated', assignment: assignments[0] });

    res.json({ assignment: assignments[0] });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

export default router;
