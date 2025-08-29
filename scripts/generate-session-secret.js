#!/usr/bin/env node

/**
 * Generate Session Secret Script
 * 
 * This script generates a secure session secret for the application.
 * Run this script to generate a new session secret for your .env file.
 */

const crypto = require('crypto');

function generateSessionSecret() {
  // Generate a 64-character hex string (32 bytes)
  const secret = crypto.randomBytes(32).toString('hex');
  return secret;
}

function main() {
  const secret = generateSessionSecret();
  
  console.log('🔐 Generated Session Secret:');
  console.log('');
  console.log(`SESSION_SECRET=${secret}`);
  console.log('');
  console.log('📝 Add this to your .env file in the backend directory.');
  console.log('');
  console.log('Example .env file content:');
  console.log('');
  console.log('# Database Configuration');
  console.log('DB_USERNAME=your_db_username');
  console.log('DB_PASSWORD=your_db_password');
  console.log('DB_HOST=localhost');
  console.log('DB_NAME=your_database_name');
  console.log('DATABASE_URL=mysql://your_db_username:your_db_password@localhost:3306/your_database_name');
  console.log('SHADOW_DATABASE_URL=mysql://your_db_username:your_db_password@localhost:3306/your_shadow_database_name');
  console.log('');
  console.log('# Session Configuration');
  console.log(`SESSION_SECRET=${secret}`);
  console.log('');
  console.log('# Environment');
  console.log('NODE_ENV=development');
}

if (require.main === module) {
  main();
}

module.exports = { generateSessionSecret };
