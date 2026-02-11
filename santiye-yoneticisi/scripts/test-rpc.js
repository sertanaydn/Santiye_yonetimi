const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) envVars[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testRpc() {
    console.log("Testing upsert_machine_log RPC...");

    // 1. Get a valid transaction ID to link to (or use a dummy one if FK allows, but FK likely exists)
    // We'll pick the latest transaction to try to update its log
    const { data: txs } = await supabase.from('site_transactions').select('id').limit(1);

    if (!txs || txs.length === 0) {
        console.log("No transactions to test with.");
        return;
    }

    const txId = txs[0].id;
    console.log("Target Transaction ID:", txId);

    const payload = {
        p_transaction_id: txId,
        p_machine_name: 'TEST_MACHINE',
        p_operator_name: 'TEST_OPERATOR_RPC',
        p_work_date: new Date().toISOString().split('T')[0],
        p_hours_worked: 5,
        p_location_detail: 'TEST_LOC',
        p_notes: 'TEST_RPC_CALL'
    };

    const { data, error } = await supabase.rpc('upsert_machine_log', payload);

    if (error) {
        console.error("RPC FAILED:", error);
    } else {
        console.log("RPC SUCCESS:", data);
    }
}

testRpc();
