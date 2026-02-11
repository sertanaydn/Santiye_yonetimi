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

async function backfillLogs() {
    console.log("Backfilling missing machine logs...");

    // 1. Get all transactions that SHOULD have machine logs
    const { data: transactions } = await supabase
        .from('site_transactions')
        .select('*')
        .in('category', ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine']);

    console.log(`Found ${transactions.length} candidate transactions.`);

    for (const t of transactions) {
        // 2. Check if log exists
        const { data: log } = await supabase
            .from('machine_logs')
            .select('id')
            .eq('transaction_id', t.id)
            .maybeSingle();

        if (!log) {
            console.log(`Creating missing log for ${t.id} (${t.category})...`);

            const payload = {
                transaction_id: t.id,
                machine_name: t.category, // Default to category
                operator_name: null, // Unknown
                work_date: t.transaction_date,
                hours_worked: t.quantity || 0,
                location_detail: t.district || 'Şantiye',
                notes: t.description
            };

            const { error } = await supabase.from('machine_logs').insert([payload]);
            if (error) console.error("Error creating log:", error);
            else console.log("Log created.");
        } else {
            console.log(`Log exists for ${t.id}.`);
        }
    }
}

backfillLogs();
