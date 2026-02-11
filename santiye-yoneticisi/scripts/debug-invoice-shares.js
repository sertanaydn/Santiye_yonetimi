const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceData() {
    const { data, error } = await supabase
        .from('iron_invoices')
        .select('id, invoice_number, camsan_share, koparan_share')
        .eq('invoice_number', 'OZT2026000000285')
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Invoice Data:', JSON.stringify(data, null, 2));
    }
}

checkInvoiceData();
