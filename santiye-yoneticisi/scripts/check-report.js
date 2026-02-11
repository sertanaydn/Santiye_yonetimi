
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// 1. Manually Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val) {
        let value = val.join('=');
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        envVars[key.trim()] = value.trim();
    }
});

async function main() {
    console.log("-> Authenticating...");

    const auth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['RAPOR'];

        if (!sheet) {
            console.log("'RAPOR' sayfası bulunamadı.");
            return;
        }

        await sheet.loadHeaderRow();
        console.log(`\n[RAPOR] Sayfası Başlıkları (${sheet.headerValues.length} adet):`);
        console.log(sheet.headerValues.join(', '));

        // Check for specific columns
        const hasTutar = sheet.headerValues.includes('TUTAR');
        const hasKDV = sheet.headerValues.includes('KDV');

        console.log(`\nİçeriyor mu?`);
        console.log(`- TUTAR: ${hasTutar ? 'EVET' : 'HAYIR'}`);
        console.log(`- KDV: ${hasKDV ? 'EVET' : 'HAYIR'}`);

    } catch (error) {
        console.error(error);
    }
}

main();
