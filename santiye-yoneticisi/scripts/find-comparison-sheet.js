
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
        console.log(`Title: ${doc.title}`);
        console.log(`Sheet Count: ${doc.sheetCount}`);

        for (let i = 0; i < doc.sheetCount; i++) {
            const sheet = doc.sheetsByIndex[i];
            console.log(`\n--- Sheet [${i}]: ${sheet.title} (Rows: ${sheet.rowCount}) ---`);

            // Load more rows to be sure
            await sheet.loadCells('A1:L10');

            for (let r = 0; r < 8; r++) { // Check first 8 rows
                let rowVals = [];
                for (let c = 0; c < 12; c++) {
                    rowVals.push(sheet.getCell(r, c).value);
                }
                // Only print if row has data to reduce noise
                if (rowVals.some(v => v !== null && v !== '')) {
                    console.log(`Row ${r + 1}: ${JSON.stringify(rowVals)}`);
                }
            }
        }

    } catch (error) {
        console.error(error);
    }
}
main();
