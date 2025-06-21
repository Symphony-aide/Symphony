#!/usr/bin/env node

/**
 * Script to update frontend dependencies
 * Run with: node update-frontend-deps.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target directories containing package.json files
const targetDirs = ['web', 'languages'];

console.log('📦 Updating frontend dependencies...');

for (const dir of targetDirs) {
  if (!fs.existsSync(path.join(process.cwd(), dir, 'package.json'))) {
    console.log(`⚠️ Skipping ${dir}, package.json not found.`);
    continue;
  }

  console.log(`🔄 Updating dependencies in ${dir}...`);
  
  try {
    // Change to directory
    process.chdir(path.join(process.cwd(), dir));
    
    // Update dependencies with pnpm
    execSync('pnpm update --latest', { stdio: 'inherit' });
    
    // Go back to root
    process.chdir(process.cwd());
    
    console.log(`✅ Successfully updated dependencies in ${dir}`);
  } catch (error) {
    console.error(`❌ Error updating dependencies in ${dir}:`, error.message);
  }
}

console.log('🎉 Frontend dependencies update completed!'); 