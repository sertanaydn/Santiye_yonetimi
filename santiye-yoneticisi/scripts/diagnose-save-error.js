const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
// Manual .env parser
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        envConfig[match[1].trim()] = value;
    }
});

console.log("Environment Keys found:", Object.keys(envConfig));
const hasServiceKey = !!envConfig.SUPABASE_SERVICE_ROLE_KEY;
const hasDbUrl = !!envConfig.DATABASE_URL;
console.log("Has Service Key:", hasServiceKey);
console.log("Has DB URL:", hasDbUrl);

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function diagnose() {
    console.error("DIAGNOSIS STARTED");

    // Check key fields existence by selecting them
    const { data, error } = await supabase
        .from('waybills')
        .select('waybill_no, unit, notes')
        .limit(1);

    if (error) {
        console.error("SELECT ERROR:", error.message);
    } else {
        console.error("SELECT SUCCESS. Columns exist.");
    }
}

diagnose();
