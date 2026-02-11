
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
        console.log(`Checking ${doc.sheetCount} sheets...`);

        for (let i = 0; i < doc.sheetCount; i++) {
            const sheet = doc.sheetsByIndex[i];

            // Skip system/main sheets from "Error Check", just list them
            if (['VERİ GİRİŞİ', 'TANIMLAR', 'RAPOR'].includes(sheet.title)) {
                console.log(`[OK] ${sheet.title} (Main Sheet)`);
                continue;
            }

            // Inspect A1 for formula errors
            await sheet.loadCells('A1');
            const cell = sheet.getCell(0, 0);

            let status = "[OK]";
            if (cell.errorValue) {
                status = `[ERROR: ${cell.errorValue.message}]`;
            } else if (cell.value && String(cell.value).startsWith('#')) {
                // Sometimes error is just string value if not parsed
                status = `[ERROR: ${cell.value}]`;
            }

            console.log(`${status} ${sheet.title} (Formula: ${cell.formula || 'None'})`);

            // Auto-fix attempt if logic is obvious?
            // User said "Düzenle" (Fix/Organize)
            // If it's a known supplier sheet and has error, we might want to flag it for the Fix script.
        }

    } catch (error) {
        console.error(error);
    }
}
main();
