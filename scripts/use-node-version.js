#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args.join(' ') || 'echo "Node version switched"';

try {
  const nvmrcPath = path.join(process.cwd(), '.nvmrc');
  if (!fs.existsSync(nvmrcPath)) {
    execSync(command, { stdio: 'inherit' });
    process.exit(0);
  }
  
  const version = fs.readFileSync(nvmrcPath, 'utf8').trim();
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    execSync(`nvm use ${version} && ${command}`, { stdio: 'inherit' });
  } else {
    execSync(`unset npm_config_prefix && source ~/.nvm/nvm.sh && nvm use ${version} && ${command}`, { stdio: 'inherit', shell: '/bin/bash' });
  }
} catch (e) {
  // Silently fail if nvm is not available
  execSync(command, { stdio: 'inherit' });
}