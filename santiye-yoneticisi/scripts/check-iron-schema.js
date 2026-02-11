const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
// Manual .env parser
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        envConfig[match[1].trim()] = value;
    }
});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function diagnose() {
    console.error("DIAGNOSIS STARTED: Iron Invoices");

    // Check if table exists by selecting
    const { data, error } = await supabase
        .from('iron_invoices')
        .select('*')
        .limit(1);

    if (error) {
        console.error("SELECT ERROR:", error.message);
        if (error.message.includes('relation "iron_invoices" does not exist')) {
            console.error("CRITICAL: Table 'iron_invoices' does not exist!");
        }
    } else {
        console.error("SELECT SUCCESS. Table 'iron_invoices' exists.");
        if (data && data.length > 0) {
            console.error("Columns:", Object.keys(data[0]));
        } else {
            console.error("Table is empty but accessible.");
        }
    }

    // Check items table
    const { error: itemsError } = await supabase
        .from('iron_invoice_items')
        .select('*')
        .limit(1);

    if (itemsError) {
        console.error("ITEMS SELECT ERROR:", itemsError.message);
    } else {
        console.error("ITEMS SELECT SUCCESS. Table 'iron_invoice_items' exists.");
    }
}

diagnose();
