#!/usr/bin/env node

/**
 * Backward compatibility entry point
 * Redirects to the new src/index.js structure
 */

const path = require('path');
const fs = require('fs');

// Check if the new structure exists
const newIndexPath = path.join(__dirname, 'src', 'index.js');

if (fs.existsSync(newIndexPath)) {
  // Use the new structure
  require('./src/index.js');
} else {
  console.error('❌ Error: New source structure not found.');
  console.error('Please ensure you have run the refactoring process.');
  console.error('Expected file: src/index.js');
  process.exit(1);
}