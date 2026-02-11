
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

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

    const SHEET_ID = '1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();

        const sheetTitle = 'KOPARAN';
        let sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) {
            console.log(`Creating sheet: ${sheetTitle}`);
            sheet = await doc.addSheet({ title: sheetTitle });
        } else {
            console.log(`Sheet exists, clearing: ${sheetTitle}`);
            await sheet.clear();
        }

        // Formula: =QUERY('VERİ GİRİŞİ'!A:P; "Select * Where E = 'Koparan'"; 1)
        // E is Col 4 (Tedarikçi)
        const query = `=QUERY('VERİ GİRİŞİ'!A:P; "SELECT * WHERE E = 'Koparan'"; 1)`;

        await sheet.loadCells('A1');
        sheet.getCell(0, 0).formula = query;
        await sheet.saveUpdatedCells();

        console.log("\n[SUCCESS] 'KOPARAN' sheet created. Ready for data.");

    } catch (error) {
        console.error(error);
    }
}
main();
