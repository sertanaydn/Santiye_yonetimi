
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

    // NEW ID from User
    const SHEET_ID = '1Ig3EwLNfaB4f1bC1JhuY7oMsis8ZnE1Fdi-gCftvIwc';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        console.log(`Title: ${doc.title}`);

        await doc.loadInfo();
        console.log(`Title: ${doc.title}`);

        console.log("--- Sheets Available ---");
        doc.sheetsByIndex.forEach((s, i) => {
            console.log(`[${i}] ${s.title} (Rows: ${s.rowCount})`);
        });

        // Try to find one with a date-like name or '30.01'
        const targetSheet = doc.sheetsByIndex.find(s => s.title.includes('2026') || s.title.includes('.01.')) || doc.sheetsByIndex[0];
        console.log(`\nInspecting Target: ${targetSheet.title}`);

        await targetSheet.loadCells('A1:Z500'); // Load bigger chunk

        console.log("--- Scanning for Prices ---");
        let priceCount = 0;
        for (let r = 5; r < 500; r++) { // Start from row 6 (index 5)
            const priceCell = targetSheet.getCell(r, 8); // Col I (Index 8)
            const firmCell = targetSheet.getCell(r, 1); // Col B (Index 1)

            if (priceCell.value !== null && priceCell.value !== '') {
                console.log(`Row ${r + 1}: Firm=${firmCell.value}, Price=${priceCell.value}`);
                priceCount++;
            }

            // Detect Block Headers? (If Col B has value and Col I is null/header?)
            if (firmCell.value && r > 5 && r % 10 === 0) { // Just sampling block starts
                // console.log(`Potential Block at Row ${r+1}: ${firmCell.value}`);
            }
        }
        console.log(`Total Prices Found in first 200 rows: ${priceCount}`);

    } catch (error) {
        console.error("Error accessing sheet:", error.message);
        if (error.response) console.error(error.response.data);
    }
}
main();
