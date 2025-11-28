#!/usr/bin/env node

/**
 * iOS Simulator Web Emulator Server
 * Streams simulator screen to web browser for interactive testing
 */

const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 9222;

// Serve static files
app.use(express.static(path.join(__dirname, 'emulator-web')));

// Get simulator screenshot
app.get('/api/screenshot', async (req, res) => {
  try {
    const screenshotPath = '/tmp/simulator-screenshot.png';

    exec(`xcrun simctl io booted screenshot ${screenshotPath}`, (error) => {
      if (error) {
        console.error('Screenshot error:', error);
        res.status(500).json({ error: 'Failed to capture screenshot' });
        return;
      }

      res.sendFile(screenshotPath);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate tap
app.post('/api/tap', express.json(), (req, res) => {
  const { x, y } = req.body;

  exec(`xcrun simctl io booted tap ${x} ${y}`, (error) => {
    if (error) {
      console.error('Tap error:', error);
      res.status(500).json({ error: 'Failed to simulate tap' });
      return;
    }

    res.json({ success: true });
  });
});

// Send text input
app.post('/api/text', express.json(), (req, res) => {
  const { text } = req.body;

  exec(`xcrun simctl io booted text "${text}"`, (error) => {
    if (error) {
      console.error('Text input error:', error);
      res.status(500).json({ error: 'Failed to send text' });
      return;
    }

    res.json({ success: true });
  });
});

// Home button
app.post('/api/home', (req, res) => {
  exec('xcrun simctl io booted home', (error) => {
    if (error) {
      console.error('Home button error:', error);
      res.status(500).json({ error: 'Failed to press home' });
      return;
    }

    res.json({ success: true });
  });
});

// Get simulator info
app.get('/api/info', (req, res) => {
  exec('xcrun simctl list devices booted -j', (error, stdout) => {
    if (error) {
      res.status(500).json({ error: 'Failed to get simulator info' });
      return;
    }

    try {
      const devices = JSON.parse(stdout);
      res.json(devices);
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse device info' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   iOS Simulator Web Emulator                              ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}

📱 Open in browser: http://localhost:${PORT}

Features:
  ✅ Real-time simulator screen streaming
  ✅ Click to interact with app
  ✅ Type text inputs
  ✅ Home button control

Press Ctrl+C to stop
  `);
});
