const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"(.*)"$/, '$1');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase URL or Key missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGeneralInvoicesSchema() {
    console.log('CHECKING GENERAL INVOICE SCHEMA');

    // Check general_invoices table
    const { data: invData, error: invError } = await supabase
        .from('general_invoices')
        .select('*')
        .limit(1);

    if (invError) {
        if (invError.code === '42P01') {
            console.log('❌ general_invoices table does not exist');
        } else {
            console.error('❌ general_invoices check error:', invError.message);
        }
    } else {
        console.log('✅ general_invoices table exists');
    }

    // Check general_invoice_items table
    const { data: itemData, error: itemError } = await supabase
        .from('general_invoice_items')
        .select('*')
        .limit(1);

    if (itemError) {
        if (itemError.code === '42P01') {
            console.log('❌ general_invoice_items table does not exist');
        } else {
            console.error('❌ general_invoice_items check error:', itemError.message);
        }
    } else {
        console.log('✅ general_invoice_items table exists');
    }
}

checkGeneralInvoicesSchema();
