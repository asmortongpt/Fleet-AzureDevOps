// Quick API server with AI endpoints
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// AI Test Endpoints
app.post('/api/ai/query', async (req, res) => {
  try {
    const { Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: req.body.query || 'Hello' }]
    });
    res.json({ success: true, response: response.content[0].text });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/ai/openai', async (req, res) => {
  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: req.body.query || 'Hello' }]
    });
    res.json({ success: true, response: response.choices[0].message.content });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// OBD2 Mock Endpoint
app.post('/api/obd2-emulator/start', (req, res) => {
  res.json({
    success: true,
    sessionId: 'sess-' + Date.now(),
    vehicleId: req.body.vehicleId,
    profile: req.body.profile,
    wsUrl: 'ws://localhost:3000/ws/obd2'
  });
});

// 3D Models endpoint
app.get('/api/vehicle-3d/models', (req, res) => {
  res.json({
    models: [
      { id: 1, name: 'Sedan', path: '/models/sedan.glb', type: 'sedan' },
      { id: 2, name: 'Truck', path: '/models/truck.glb', type: 'truck' },
      { id: 3, name: 'Van', path: '/models/van.glb', type: 'van' }
    ]
  });
});

app.get('/api/vehicle-3d/:vehicleId', (req, res) => {
  res.json({
    vehicleId: req.params.vehicleId,
    model: '/models/sedan.glb',
    color: '#0066cc',
    rotation: [0, 0, 0]
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', ai: 'enabled', emulator: 'enabled', models3d: 'enabled' }));

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Quick API with AI + 3D running on http://localhost:${PORT}`));
