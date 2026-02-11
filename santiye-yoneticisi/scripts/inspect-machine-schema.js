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

async function inspectSchema() {
    const { data: st, error: stError } = await supabase.from('site_transactions').select('*').limit(1);
    if (stError) console.error('site_transactions error:', stError.message);
    else console.log('site_transactions columns:', Object.keys(st[0] || {}));

    const { data: ml, error: mlError } = await supabase.from('machine_logs').select('*').limit(1);
    if (mlError) console.error('machine_logs error:', mlError.message);
    else console.log('machine_logs columns:', Object.keys(ml[0] || {}));
}

inspectSchema();
