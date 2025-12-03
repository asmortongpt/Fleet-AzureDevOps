
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/api/routes', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM routes ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/routes', async (req, res) => {
  try {
    const { name, start_location, end_location, distance, estimated_time } = req.body;
    const result = await db.query(
      'INSERT INTO routes (name, start_location, end_location, distance, estimated_time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, start_location, end_location, distance, estimated_time]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
