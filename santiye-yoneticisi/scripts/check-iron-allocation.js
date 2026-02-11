const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
let envConfig = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            let value = valueParts.join('=').trim();
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            envConfig[key.trim()] = value;
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('CHECKING IRON INVOICE ALLOCATION SCHEMA');

    // Check allocation column in items
    const { data: itemData, error: itemError } = await supabase
        .from('iron_invoice_items')
        .select('allocation')
        .limit(1);

    if (itemError) {
        console.error('❌ iron_invoice_items.allocation check failed:', itemError.message);
    } else {
        console.log('✅ iron_invoice_items.allocation column exists.');
    }

    // Check share columns in invoices
    const { data: invoiceData, error: invoiceError } = await supabase
        .from('iron_invoices')
        .select('camsan_share, koparan_share')
        .limit(1);

    if (invoiceError) {
        console.error('❌ iron_invoices share columns check failed:', invoiceError.message);
    } else {
        console.log('✅ iron_invoices.camsan_share and koparan_share columns exist.');
    }
}

checkSchema();
