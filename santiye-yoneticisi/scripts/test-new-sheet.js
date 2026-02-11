
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
        // Handle quotes if mostly correct (simplified)
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        envVars[key.trim()] = value.trim();
    }
});

async function main() {
    console.log("-> Authenticating...");

    // 2. Setup Auth
    const serviceAccountAuth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 3. Connect to USER PROVIDED SHEET ID
    // 1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk
    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk';
    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);

    try {
        console.log(`-> Loading Doc Info for ID: ${SHEET_ID}...`);
        await doc.loadInfo();
        console.log(`\n[SUCCESS] Connected to Google Sheet!`);
        console.log(`Title: ${doc.title}`);
        console.log(`Sheet Count: ${doc.sheetCount}`);

        console.log('\nWorksheets:');
        doc.sheetsByIndex.forEach(sheet => {
            console.log(` - [${sheet.index}] ${sheet.title} (Rows: ${sheet.rowCount}, Cols: ${sheet.columnCount})`);
        });

    } catch (error) {
        console.error('\n[ERROR] Connection Failed!');
        console.error('Reason:', error.message);
        if (error.response) {
            console.error('Details:', error.response.data);
        }
    }
}

main();
