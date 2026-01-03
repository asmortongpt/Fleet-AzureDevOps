#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FLEET APP - FULL VM ORCHESTRATION TEST');
console.log('==========================================\n');

const timestamp = new Date().toISOString();
const results = {
  timestamp,
  tests: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

// Test Agents
const agents = [
  {
    name: 'Frontend Server',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/'],
    expect: '200'
  },
  {
    name: 'Main App HTML',
    command: 'curl',
    args: ['-s', 'http://localhost:8080/'],
    check: (output) => output.includes('Fleet - Fleet Management System')
  },
  {
    name: '3D Garage Page',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/test-3d-garage.html'],
    expect: '200'
  },
  {
    name: 'Google Maps Integration',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/force-google-maps.html'],
    expect: '200'
  },
  {
    name: 'Service Worker',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/sw.js'],
    expect: '200'
  },
  {
    name: 'PWA Manifest',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/manifest.json'],
    expect: '200'
  },
  {
    name: 'Offline Page',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/offline.html'],
    expect: '200'
  },
  {
    name: 'JavaScript Bundle Check',
    command: 'bash',
    args: ['-c', 'ls ~/fleet/dist/assets/*.js | wc -l'],
    check: (output) => parseInt(output.trim()) > 0
  },
  {
    name: 'CSS Bundle Check',
    command: 'bash',
    args: ['-c', 'ls ~/fleet/dist/assets/*.css | wc -l'],
    check: (output) => parseInt(output.trim()) > 0
  },
  {
    name: 'Stats Page',
    command: 'curl',
    args: ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:8080/stats.html'],
    expect: '200'
  }
];

// Run all tests in parallel
console.log('Running', agents.length, 'parallel tests...\n');

let completed = 0;

agents.forEach((agent, index) => {
  const proc = spawn(agent.command, agent.args, { shell: true });
  let output = '';
  let error = '';

  proc.stdout.on('data', (data) => {
    output += data.toString();
  });

  proc.stderr.on('data', (data) => {
    error += data.toString();
  });

  proc.on('close', (code) => {
    completed++;
    
    let passed = false;
    if (agent.expect) {
      passed = output.trim() === agent.expect;
    } else if (agent.check) {
      passed = agent.check(output);
    } else {
      passed = code === 0;
    }

    const icon = passed ? '✅' : '❌';
    console.log(`${icon} [${completed}/${agents.length}] ${agent.name}`);
    
    if (!passed && error) {
      console.log(`   Error: ${error.substring(0, 100)}`);
    }

    results.tests.push({
      name: agent.name,
      passed,
      output: output.substring(0, 200),
      error: error.substring(0, 200)
    });

    results.summary.total++;
    if (passed) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }

    // When all complete, save results
    if (completed === agents.length) {
      console.log('\n📊 TEST SUMMARY');
      console.log('================');
      console.log(`Total:  ${results.summary.total}`);
      console.log(`Passed: ${results.summary.passed} ✅`);
      console.log(`Failed: ${results.summary.failed} ❌`);
      console.log(`Success Rate: ${Math.round(results.summary.passed / results.summary.total * 100)}%`);
      
      fs.writeFileSync('/tmp/vm-test-results.json', JSON.stringify(results, null, 2));
      console.log('\n✅ Results saved to /tmp/vm-test-results.json');
      
      process.exit(results.summary.failed > 0 ? 1 : 0);
    }
  });
});

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n❌ Tests timed out after 60 seconds');
  process.exit(1);
}, 60000);
