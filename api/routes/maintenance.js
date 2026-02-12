
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/api/maintenance', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM maintenance_records ORDER BY service_date DESC');
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/maintenance', async (req, res) => {
  try {
    const { vehicle_id, service_type, description, cost, service_date } = req.body;
    const result = await db.query(
      'INSERT INTO maintenance_records (vehicle_id, service_type, description, cost, service_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [vehicle_id, service_type, description, cost, service_date || new Date()]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
