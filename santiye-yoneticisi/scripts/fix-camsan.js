
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

    const SHEET_ID = '1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();

        // Fix CAMSAN
        const camsanSheet = doc.sheetsByTitle['CAMSAN'];
        if (camsanSheet) {
            console.log("Updating CAMSAN...");
            await camsanSheet.clear();

            // Formula: WHERE C = 'Camsan' OR C contains 'Camsan'
            // To be safe, let's use CONTAINS to catch slight variations, 
            // BUT that might catch 'Camsan&Koparan' too.
            // If user wants distinct sheets, use EXACT match.
            // Data showed: 'Camsan' (Exact).
            // Col C is Firma (Index 2).
            // A=ONAY, B=TARİH, C=FİRMA

            const query = `=QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE C = 'Camsan'"; 1)`;
            await camsanSheet.loadCells('A1');
            camsanSheet.getCell(0, 0).formula = query;
            await camsanSheet.saveUpdatedCells();
            console.log("CAMSAN Updated.");
        } else {
            console.log("CAMSAN sheet not found!");
        }

        // Fix CAMSAN&KOPARAN
        const ckSheet = doc.sheetsByTitle['CAMSAN&KOPARAN'];
        if (ckSheet) {
            console.log("Updating CAMSAN&KOPARAN...");
            await ckSheet.clear();
            const query = `=QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE C = 'Camsan&Koparan'"; 1)`;
            await ckSheet.loadCells('A1');
            ckSheet.getCell(0, 0).formula = query;
            await ckSheet.saveUpdatedCells();
            console.log("CAMSAN&KOPARAN Updated.");
        }

    } catch (error) {
        console.error(error);
    }
}
main();
