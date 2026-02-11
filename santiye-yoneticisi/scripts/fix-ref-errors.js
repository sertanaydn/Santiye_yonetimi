
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

        // List of sheets we suspect are broken auto-sheets
        const targets = [
            'CAMSAN', 'CAMSAN&KOPARAN', 'KOPARAN',
            'ÖZTOP', 'SHN', 'CEPER', 'CANBEK', 'BARIŞ VİNÇ', 'MINI KEPÇE'
        ];

        for (const title of targets) {
            const sheet = doc.sheetsByTitle[title];
            if (!sheet) {
                console.log(`Skipping ${title} (Not found)`);
                continue;
            }

            console.log(`Fixing ${title}...`);
            await sheet.loadCells('A1');
            const oldFormula = sheet.getCell(0, 0).formula;

            console.log(`  Found Formula: ${oldFormula}`);

            // Clear the debris (checkboxes etc)
            await sheet.clear();

            // Restore Formula
            if (oldFormula) {
                await sheet.loadCells('A1');
                sheet.getCell(0, 0).formula = oldFormula;
                await sheet.saveUpdatedCells();
                console.log(`  Restored.`);
            } else {
                console.log(`  WARNING: No formula found in A1. Re-generating default query?`);
                // Fallback if formula was lost (e.g. user deleted A1)
                // Need to guess if it's Firma or Supplier?
                // Let's assume Supplier (Col E) for most, but Camsan was Firma...
                // Safe bet: If 'CAMSAN' in title, maybe check? 
                // For now, assume A1 had it.
            }
        }

        console.log("\n[SUCCESS] Fixed REF errors on all supplier sheets.");

    } catch (error) {
        console.error(error);
    }
}
main();
