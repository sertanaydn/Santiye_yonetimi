
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

    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['RAPOR'];

        if (!sheet) { console.log("RAPOR sayfası yok."); return; }

        await sheet.loadCells('A1:O5'); // Load top 5 rows to see headers, filters, and formula start

        console.log("--- Cells Analysis ---");
        // Print Cell Values and Formulas
        for (let r = 0; r < 5; r++) {
            let rowLog = [];
            for (let c = 0; c < 15; c++) {
                const cell = sheet.getCell(r, c);
                let val = cell.value;
                if (cell.formula) val = `[FORMULA: ${cell.formula}]`;
                rowLog.push(val);
            }
            console.log(`Row ${r + 1}:`, rowLog);
        }

    } catch (error) {
        console.error(error);
    }
}
main();
