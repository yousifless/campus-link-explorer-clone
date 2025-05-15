import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key not found in environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyReferralMigration() {
  console.log('Starting referral system migration...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./src/migrations/referral_system.sql', 'utf8');
    
    // Split into separate statements to handle multiple statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (const [index, stmt] of statements.entries()) {
      if (!stmt.trim()) continue;
      
      console.log(`Executing statement ${index + 1}/${statements.length}...`);
      
      try {
        // Execute the SQL statement
        const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
        
        if (error) {
          console.warn(`Warning: Error executing statement ${index + 1}:`, error);
          
          // If there's an error about the function already existing, we can continue
          if (error.message.includes('already exists')) {
            console.log('Function already exists, continuing...');
          } else {
            // For other errors, we might want to pause and ask what to do
            const response = await prompt('Continue despite error? (y/n): ');
            if (response.toLowerCase() !== 'y') {
              process.exit(1);
            }
          }
        } else {
          console.log(`Statement ${index + 1} executed successfully.`);
        }
      } catch (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
        process.exit(1);
      }
    }
    
    console.log('Referral system migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Simple prompt function
function prompt(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.once('data', (data) => {
      resolve(data.toString().trim());
    });
  });
}

// Run the migration
applyReferralMigration(); 