
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

    // NEW ID from User link: https://docs.google.com/spreadsheets/d/1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA/edit
    const SHEET_ID = '1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        console.log(`Title: ${doc.title}`);
        console.log(`Sheets: ${doc.sheetCount}`);

        for (let i = 0; i < doc.sheetCount; i++) {
            const sheet = doc.sheetsByIndex[i];
            console.log(`\n[${i}] ${sheet.title} (Rows: ${sheet.rowCount})`);

            // If it's RAPOR or VERİ GİRİŞİ, inspect headers
            if (sheet.title.includes('RAPOR') || sheet.title.includes('VERİ') || sheet.title.includes('TANIM')) {
                await sheet.loadCells('A1:K6');
                console.log("  Headers/First Rows:");
                for (let r = 0; r < 5; r++) {
                    const vals = [];
                    for (let c = 0; c < 10; c++) vals.push(sheet.getCell(r, c).value);
                    console.log(`  Row ${r + 1}: ${JSON.stringify(vals)}`);
                }
            }
        }

    } catch (error) {
        console.error("Error accessing sheet:", error.message);
        if (error.response) console.error("Details:", error.response.data);
    }
}
main();
