
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/api/inspections', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM inspections ORDER BY inspection_date DESC');
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/inspections', async (req, res) => {
  try {
    const { vehicle_id, inspector_name, passed, notes, inspection_date } = req.body;
    const result = await db.query(
      'INSERT INTO inspections (vehicle_id, inspector_name, passed, notes, inspection_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [vehicle_id, inspector_name, passed, notes, inspection_date || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
