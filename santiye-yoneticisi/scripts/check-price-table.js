
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n').filter(Boolean).map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log("Checking price_entries table...");
    try {
        const { count, error } = await supabase
            .from('price_entries')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error accessing table:", error.message);
            // Suggest creation script if it fails
        } else {
            console.log(`Table exists and is accessible. Row count: ${count}`);
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

checkTable();
