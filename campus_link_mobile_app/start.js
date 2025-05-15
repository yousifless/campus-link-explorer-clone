#!/usr/bin/env node

/**
 * Campus Link Mobile App Starter
 * 
 * This script helps start the app without requiring an Expo login
 * and also sets up environment variables for Supabase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            Campus Link Mobile App            ┃
┃              Development Starter             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
${colors.reset}`);

// Check for required environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// If environment variables are not set, ask the user
if (!supabaseUrl || !supabaseAnonKey) {
  console.log(`${colors.yellow}Supabase configuration not found in environment variables.${colors.reset}`);
  console.log(`${colors.yellow}You can set them up before running this script:${colors.reset}`);
  console.log(`
  ${colors.green}For Windows (PowerShell):${colors.reset}
  $env:EXPO_PUBLIC_SUPABASE_URL="your_supabase_url"
  $env:EXPO_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
  
  ${colors.green}For macOS/Linux:${colors.reset}
  export EXPO_PUBLIC_SUPABASE_URL="your_supabase_url"
  export EXPO_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
  `);

  console.log(`${colors.green}You can continue without setting these, but the app will use demo mode.${colors.reset}`);
  console.log(`${colors.yellow}Starting Expo in offline mode to avoid login requirements...${colors.reset}`);
}

try {
  // Start Expo in offline mode
  console.log(`${colors.bright}${colors.green}Starting Expo server...${colors.reset}`);
  execSync('npx expo start --offline', { stdio: 'inherit' });
} catch (error) {
  console.error(`${colors.red}Failed to start Expo:${colors.reset}`, error.message);
  process.exit(1);
} 