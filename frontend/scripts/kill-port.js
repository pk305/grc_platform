#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

function killPid(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    console.log(`Killed process ${pid}`);
  } catch {}
}

try {
  const pids = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(Number);

  pids.forEach(killPid);
} catch {}

const lockPath = path.join(__dirname, '..', '.next', 'dev', 'lock');
try {
  const { pid } = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (pid) killPid(pid);
} catch {}
