
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
        // Col C is Index 2 (0=ONAY, 1=TARİH, 2=FİRMA)
        // Wait... In previous cleanup I deleted Col B (Index 1).
        // Before Cleanup: 
        // 0=ONAY, 1=ONAY, 2=TARİH, 3=FİRMA
        // After Cleanup (Deleted Index 1):
        // 0=ONAY, 1=TARİH, 2=FİRMA, 3=TEDARİKÇİ

        // So Firma is Index 2 (Col C).
        await sheet.loadCells('A1:C100'); // Load top 100

        console.log("Header C:", sheet.getCell(0, 2).value);

        const firms = new Set();
        for (let i = 1; i < 100; i++) {
            const val = sheet.getCell(i, 2).value;
            if (val) firms.add(`'${val}'`);
        }

        console.log("Found Firms:", Array.from(firms));

    } catch (error) {
        console.error(error);
    }
}
main();
