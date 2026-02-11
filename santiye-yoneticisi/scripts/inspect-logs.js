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

async function inspectLogs() {
    console.log("Checking machine_logs data...");
    const { data, error } = await supabase.from('machine_logs').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Logs found:", data.length);
        if (data.length > 0) {
            console.log("Sample Log:", data[0]);
        } else {
            console.log("No logs found.");
        }
    }
}
inspectLogs();
