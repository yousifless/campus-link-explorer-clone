import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the current file's directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  console.log('Starting migration process...');

  try {
    // Path to migrations directory
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    
    // Read migration files
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Apply each migration
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      
      // Read SQL content
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute SQL
      const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
        
        // Continue with next migration instead of exiting
        continue;
      }
      
      console.log(`Successfully applied migration: ${file}`);
    }
    
    console.log('Migration process completed');
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  }
}

// Run migrations
applyMigrations(); 