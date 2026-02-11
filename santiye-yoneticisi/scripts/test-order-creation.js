
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim().replace(/"/g, '');
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value.trim().replace(/"/g, '');
        }
    }
} catch (e) {
    console.error('Could not read .env.local', e);
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderCreation() {
    console.log('Testing Purchase Order Creation...');

    const testOrder = {
        supplier_name: 'Test Supplier',
        order_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        total_amount: 100,
        tax_amount: 20,
        grand_total: 120,
        notes: 'Test Order via Script'
    };

    const { data, error } = await supabase
        .from('purchase_orders')
        .insert(testOrder)
        .select()
        .single();

    if (error) {
        console.error('Insertion Failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
        console.error('Full Error:', JSON.stringify(error, null, 2));
    } else {
        console.log('Success! Created Order ID:', data.id);

        // Cleanup
        console.log('Cleaning up...');
        await supabase.from('purchase_orders').delete().eq('id', data.id);
        console.log('Deleted test order.');
    }
}

testOrderCreation();
