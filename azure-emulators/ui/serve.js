#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Serve index.html
    const filePath = path.join(__dirname, 'index.html');

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500);
            res.end('Error loading page');
            return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('🚗 City of Tallahassee Fleet Emulator Dashboard');
    console.log('================================================');
    console.log('');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log('');
    console.log('Features:');
    console.log('  • 300 vehicles on interactive map');
    console.log('  • Real-time updates every 2 seconds');
    console.log('  • Click any vehicle to view mobile app screen');
    console.log('  • Filter by department and status');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});
