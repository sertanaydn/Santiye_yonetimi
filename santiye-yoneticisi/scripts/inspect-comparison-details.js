
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

    const SHEET_ID = '1Ig3EwLNfaB4f1bC1JhuY7oMsis8ZnE1Fdi-gCftvIwc';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        // Load Sheet Index 1 ("30.01.2026")
        const sheet = doc.sheetsByIndex[1];
        console.log(`\n--- Sheet: ${sheet.title} (Rows: ${sheet.rowCount}) ---`);

        // Load 50 rows to capture ÖZTOP, FAAT, SHN YAPI blocks
        await sheet.loadCells('A1:L50');

        // Print rows where Column B (Index 1) or I (Index 8) has data
        for (let r = 0; r < 50; r++) {
            let rowVals = [];
            let hasData = false;
            for (let c = 0; c < 12; c++) {
                const val = sheet.getCell(r, c).value;
                rowVals.push(val);
                if (val !== null && val !== '') hasData = true;
            }
            if (hasData) {
                // Clean up output for readability
                const cleanVals = rowVals.map(v => v === null ? '' : v);
                console.log(`Row ${r + 1}: ${JSON.stringify(cleanVals)}`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
main();
