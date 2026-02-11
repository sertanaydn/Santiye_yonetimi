
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
    const auth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['VERİ GİRİŞİ'];

        await sheet.loadCells('A1:E1000');

        const suppliers = new Set();
        // Start from Row 1
        for (let r = 1; r < 1000; r++) {
            // Col E is Index 4 (Tedarikçi)
            const cell = sheet.getCell(r, 4);
            if (cell.value) {
                suppliers.add(String(cell.value).trim());
            }
        }

        console.log("Unique Suppliers:", Array.from(suppliers));

    } catch (error) {
        console.error(error);
    }
}
main();
