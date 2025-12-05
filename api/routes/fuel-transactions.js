
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/api/fuel-transactions', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM fuel_transactions ORDER BY transaction_date DESC');
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/fuel-transactions', async (req, res) => {
  try {
    const { vehicle_id, gallons, cost_per_gallon, total_cost, odometer } = req.body;
    const result = await db.query(
      'INSERT INTO fuel_transactions (vehicle_id, gallons, cost_per_gallon, total_cost, odometer) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [vehicle_id, gallons, cost_per_gallon, total_cost, odometer]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
