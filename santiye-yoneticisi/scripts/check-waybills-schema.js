const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
    console.log("Checking waybills table structure...");

    // We'll try to insert a dummy row to see if it fails, or just select
    // Since we can't easily DESCRIBE table via JS client without admin rights or sql function...
    // We will try to select one row and see keys.

    const { data, error } = await supabase
        .from('waybills')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting waybills:", error);
    } else if (data && data.length > 0) {
        console.log("Columns found in existing row:", Object.keys(data[0]));
    } else {
        console.log("No data found. Trying to insert a test row with all columns to check validity...");
        // This is risky if strict constraints exist, but useful for debugging column existence.
        // We won't actually insert, we'll just rely on the fact that we can't 'describe'.
        console.log("Table is empty, cannot infer columns from data.");
    }
}

checkSchema();
