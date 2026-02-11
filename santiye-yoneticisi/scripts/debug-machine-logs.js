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

async function inspectLatest() {
    console.log("Fetching last 5 'machine like' transactions...");
    const { data: transactions, error } = await supabase
        .from('site_transactions')
        .select(`
            id, 
            description, 
            category, 
            transaction_date,
            firm_name,
            machine_logs(*)
        `)
        .in('category', ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine'])
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching transactions:", error);
        return;
    }

    console.log("Transactions Found:", transactions.length);
    transactions.forEach((t, i) => {
        console.log(`\n--- Transaction ${i + 1} ---`);
        console.log(`ID: ${t.id}`);
        console.log(`Category: ${t.category}`);
        console.log(`Firm: ${t.firm_name}`);
        console.log(`Logs Linked: ${t.machine_logs?.length || 0}`);
        if (t.machine_logs?.length) {
            console.log("Log Details:", t.machine_logs[0]);
        }
    });
}

inspectLatest();
