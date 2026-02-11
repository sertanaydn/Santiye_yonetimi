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
    console.log('CHECKING GENERAL INVOICE SCHEMA');

    // Check general_invoices table
    const { error: headerError } = await supabase
        .from('general_invoices')
        .select('id')
        .limit(1);

    if (headerError) {
        if (headerError.code === '42P01') {
            console.log('❌ general_invoices table DOES NOT exist.');
        } else {
            console.log('❌ general_invoices error:', headerError.message);
        }
    } else {
        console.log('✅ general_invoices table exists.');
    }

    // Check general_invoice_items table
    const { error: itemError } = await supabase
        .from('general_invoice_items')
        .select('id')
        .limit(1);

    if (itemError) {
        if (itemError.code === '42P01') {
            console.log('❌ general_invoice_items table DOES NOT exist.');
        } else {
            console.log('❌ general_invoice_items error:', itemError.message);
        }
    } else {
        console.log('✅ general_invoice_items table exists.');
    }
}

checkSchema();
