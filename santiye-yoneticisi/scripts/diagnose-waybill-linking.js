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
    console.log('Available Config Keys:', Object.keys(envConfig));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('DIAGNOSIS STARTED');

    // 1. Check if invoice_id column exists by trying to select it
    console.log('1. Checking convertion of invoice_id column...');
    const { data: colCheck, error: colError } = await supabase
        .from('waybills')
        .select('invoice_id')
        .limit(1);

    if (colError) {
        console.error('❌ Column Check Failed:', colError.message);
        if (colError.message.includes('invoice_id') && colError.message.includes('does not exist')) {
            console.log('>> FATAL: invoice_id column DOES NOT EXIST. The SQL migration was not run or failed.');
        }
    } else {
        console.log('✅ invoice_id column exists.');
    }

    // 2. Check for ANY waybills (RLS Check)
    console.log('2. Checking for ANY waybills (RLS Check)...');
    const { data: allWaybills, error: allError } = await supabase
        .from('waybills')
        .select('id, supplier, waybill_no, invoice_id')
        .limit(10);

    if (allError) {
        console.error('❌ Fetch ALL Error:', allError);
    } else {
        console.log(`Found ${allWaybills?.length || 0} waybills in total (limit 10).`);
        if (allWaybills && allWaybills.length > 0) {
            console.log('Suppliers found in sample:', allWaybills.map(w => w.supplier));
        } else {
            console.log('⚠️ No waybills found at all. Either table is empty or RLS is blocking.');
        }
    }

    // 3. Specific check for 'ÖZTOP' again if needed (skipped if allWaybills had it)
    if (allWaybills && !allWaybills.some(w => w.supplier === 'ÖZTOP')) {
        const { data: oztopData } = await supabase.from('waybills').select('*').eq('supplier', 'ÖZTOP');
        console.log(`Specific check for ÖZTOP returned: ${oztopData?.length || 0} rows.`);
    }

    // 4. Try the exact query used in the page (with materials join)
    console.log('4. Testing Page Query (with materials join)...');
    const { data: pageQueryData, error: pageQueryError } = await supabase
        .from('waybills')
        .select('id, date, waybill_no, quantity, unit, location, notes, materials(name)')
        .eq('supplier', supplierName)
        .is('invoice_id', null)
        .limit(5);

    if (pageQueryError) {
        console.error('❌ Page Query Failed:', pageQueryError.message);
    } else {
        console.log(`✅ Page Query Success. Returned ${pageQueryData?.length} rows.`);
    }

    // 4. Check Supplier Name Variations
    console.log('4. Checking specific supplier spelling variations...');
    const { data: allSuppliers } = await supabase
        .from('waybills')
        .select('supplier')
        .ilike('supplier', '%oztop%'); // wide match

    if (allSuppliers) {
        const uniqueSuppliers = [...new Set(allSuppliers.map(s => s.supplier))];
        console.log('Found supplier variations in waybills:', uniqueSuppliers);
    }

}

diagnose();
