
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

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

    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk'; // User's main sheet
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['VERİ GİRİŞİ'];
        if (!sheet) {
            console.error("'VERİ GİRİŞİ' not found");
            return;
        }
        await sheet.loadCells('A1:Z5');

        console.log(`Sheet: ${sheet.title} (Rows: ${sheet.rowCount})`);

        const headers = [];
        for (let c = 0; c < 20; c++) {
            headers.push(sheet.getCell(2, c).value); // Row 3 is headers? Or Row 1? Let's check first few rows.
        }

        console.log("Row 1:", [0, 1, 2, 3, 4].map(c => sheet.getCell(0, c).value));
        console.log("Row 2:", [0, 1, 2, 3, 4].map(c => sheet.getCell(1, c).value));
        console.log("Row 3 (Likely Headers based on previous interactions?):");

        // In previous CSV analysis, headers were around line 5?
        // Let's just dump first 5 rows to be safe.
        for (let r = 0; r < 5; r++) {
            const row = [];
            for (let c = 0; c < 15; c++) row.push(sheet.getCell(r, c).value);
            console.log(`Row ${r + 1}:`, JSON.stringify(row));
        }

    } catch (error) {
        console.error(error);
    }
}
main();
