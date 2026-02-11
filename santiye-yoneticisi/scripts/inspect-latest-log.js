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

async function inspectLastLog() {
    console.log("Fetching the absolute latest transaction...");

    // Get latest transaction by created_at
    const { data: transactions } = await supabase
        .from('site_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (!transactions || transactions.length === 0) {
        console.log("No transactions found.");
        return;
    }

    const latestTx = transactions[0];
    console.log("\n--- Latest Transaction ---");
    console.log("ID:", latestTx.id);
    console.log("Category:", latestTx.category);
    console.log("Date:", latestTx.transaction_date);
    console.log("Created At:", latestTx.created_at);

    // Check for linked machine log
    const { data: logs, error } = await supabase
        .from('machine_logs')
        .select('*')
        .eq('transaction_id', latestTx.id);

    if (error) {
        console.error("Error fetching machine log:", error);
    } else if (logs && logs.length > 0) {
        console.log("\n--- Linked Machine Log ---");
        console.log("Log ID:", logs[0].id);
        console.log("Machine Name:", logs[0].machine_name);
        console.log("Operator Name:", logs[0].operator_name); // Crucial check
        console.log("Hours:", logs[0].hours_worked);
    } else {
        console.log("\n!!! NO LINKED MACHINE LOG FOUND for this transaction. !!!");
    }
}

inspectLastLog();
