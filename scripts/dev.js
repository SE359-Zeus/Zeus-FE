#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');

const logStream = fs.createWriteStream('dev.log', { flags: 'a' });

const child = spawn('npx', ['next', 'dev', '-p', '3003'], { shell: true });

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  logStream.write(chunk);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  logStream.write(chunk);
});

child.on('close', (code) => {
  logStream.end();
  process.exit(code);
});
