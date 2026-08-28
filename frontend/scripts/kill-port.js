#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;

function killPid(pid) {
  try {
    process.kill(pid, 'SIGKILL');
    console.log(`Killed process ${pid}`);
  } catch {
    // Already dead.
  }
}

// Kill whatever is bound to the dev port.
try {
  const pids = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(Number);

  pids.forEach(killPid);
} catch {
  // Nothing listening on the port.
}

// Next.js also tracks a single dev server instance via .next/dev/lock,
// independent of the port it ended up bound to — kill it too so a stale
// suspended/backgrounded `next dev` doesn't block the new one from starting.
const lockPath = path.join(__dirname, '..', '.next', 'dev', 'lock');
try {
  const { pid } = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (pid) killPid(pid);
} catch {
  // No lock file, or nothing to parse.
}
