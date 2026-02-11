
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually verify .env.local
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const lines = envConfig.split('\n');
    lines.forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
            if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = value.trim();
        }
    });
}

if (!supabaseUrl || !supabaseKey) {
    console.error('HATA: .env.local dosyasından Supabase bilgileri okunamadı.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('Veritabanı Şeması Kontrol Ediliyor...\n');

    const tablesToCheck = ['site_transactions', 'iron_invoices', 'iron_invoice_items', 'waybills'];
    const issues = [];

    for (const table of tablesToCheck) {
        console.log(`--- Tablo: ${table} ---`);

        const { data, error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.error(`HATA: Tabloya erişilemedi (${error.message})`);
            issues.push(`${table}: Tablo bulunamadı veya erişim reddedildi.`);
            continue;
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]);
            console.log('Mevcut Sütunlar:', columns.join(', '));

            if (table === 'site_transactions') {
                const missing = [];
                if (!columns.includes('vat_amount')) missing.push('vat_amount (KDV Tutarı)');
                if (!columns.includes('company')) missing.push('company (Firma Adı)');
                if (!columns.includes('firm_name') && !columns.includes('company')) missing.push('firm_name veya company');
                if (!columns.includes('detail')) missing.push('detail');

                if (missing.length > 0) {
                    console.error('❌ EKSİK SÜTUNLAR:', missing.join(', '));
                    issues.push(`${table}: Eksik sütunlar -> ${missing.join(', ')}`);
                } else {
                    console.log('✅ Kritik sütunlar mevcut.');
                }
            } else {
                console.log('✅ Tablo ve sütunlar mevcut.');
            }
        } else {
            console.log('⚠️ Tablo boş, sütunlar kontrol edilemedi.');
            issues.push(`${table}: Tablo boş, detaylı şema kontrolü yapılamadı (Veri yok).`);
            // Note: Empty table isn't necessarily an error, but prevents checking exact columns easily via select *
        }
        console.log('\n');
    }

    if (issues.length > 0) {
        console.log('--- ⚠️ TESPİT EDİLEN SORUNLAR ---');
        issues.forEach(i => console.log('- ' + i));
        console.log('\nÇÖZÜM: setup_account_transfer.sql dosyasını çalıştırın.');
    } else {
        console.log('Tüm tablolar düzgün görünüyor (veya boş).');
    }
}

inspectSchema();
