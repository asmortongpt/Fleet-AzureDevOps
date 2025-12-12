import { Router } from 'express';
import { query } from '../db';

const router = Router();

// Get overall progress summary
router.get('/summary', async (req, res) => {
  try {
    // Get epic progress
    const epics = await query('SELECT * FROM epic_progress ORDER BY epic_number');

    // Get overall stats
    const [stats] = await query(`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress') as active_tasks,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
        SUM(estimated_hours) as total_estimated_hours,
        SUM(actual_hours) as total_actual_hours,
        ROUND(AVG(percent_complete), 2) as overall_percent
      FROM tasks
    `);

    // Get active agents
    const activeAgents = await query(`
      SELECT COUNT(*) as count
      FROM agents
      WHERE active = TRUE
        AND last_heartbeat > now() - interval '5 minutes'
    `);

    // Calculate velocity
    const velocity = stats.total_actual_hours > 0
      ? (stats.total_estimated_hours / stats.total_actual_hours)
      : 0;

    res.json({
      epics,
      overall: {
        ...stats,
        velocity_multiplier: velocity.toFixed(2),
        active_agents: activeAgents[0].count
      }
    });
  } catch (error) {
    console.error('Error fetching progress summary:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// Get agent utilization
router.get('/agents', async (req, res) => {
  try {
    const agents = await query(`
      SELECT
        a.id,
        a.name,
        a.llm_model,
        a.role,
        a.vm_host,
        a.active,
        a.last_heartbeat,
        a.health_status,
        a.assignments_in_progress,
        a.avg_progress,
        CASE
          WHEN a.assignments_in_progress > 0 THEN ROUND((a.assignments_in_progress::DECIMAL / 2) * 100, 2)
          ELSE 0
        END as utilization_percent
      FROM agent_status a
      ORDER BY a.name
    `);

    res.json({ agents });
  } catch (error) {
    console.error('Error fetching agent utilization:', error);
    res.status(500).json({ error: 'Failed to fetch agent utilization' });
  }
});

// Create progress snapshot (for time-series)
router.post('/snapshot', async (req, res) => {
  try {
    const { project_id } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'Missing project_id' });
    }

    const [stats] = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as tasks_pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as tasks_in_progress,
        COUNT(*) FILTER (WHERE status = 'done') as tasks_done,
        ROUND(AVG(percent_complete), 2) as overall_percent
      FROM tasks
      WHERE project_id = $1
    `, [project_id]);

    const [agentCount] = await query(`
      SELECT COUNT(*) as count
      FROM agents
      WHERE active = TRUE
    `);

    const snapshots = await query(`
      INSERT INTO progress_snapshots
        (project_id, overall_percent, active_agents, tasks_pending, tasks_in_progress, tasks_done)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      project_id,
      stats.overall_percent || 0,
      agentCount[0].count || 0,
      stats.tasks_pending || 0,
      stats.tasks_in_progress || 0,
      stats.tasks_done || 0
    ]);

    res.json({ snapshot: snapshots[0] });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: 'Failed to create snapshot' });
  }
});

// Get progress history
router.get('/history/:project_id', async (req, res) => {
  try {
    const { project_id } = req.params;
    const { limit = 100 } = req.query;

    const snapshots = await query(`
      SELECT *
      FROM progress_snapshots
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [project_id, limit]);

    res.json({ snapshots: snapshots.reverse() });
  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({ error: 'Failed to fetch progress history' });
  }
});

export default router;
