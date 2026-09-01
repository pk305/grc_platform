#!/usr/bin/env node
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('child_process');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

const port = process.env.PORT || 3000;

function killPid(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    console.log(`Killed process ${pid}`);
  } catch {}
}

try {
  const pids = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
    stdio: ['ignore', 'pipe', 'ignore']
  })
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
