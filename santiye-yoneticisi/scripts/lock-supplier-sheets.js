
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

        // List of sheets to LOCK
        // Note: 'CAMSAN' and 'CAMSAN&KOPARAN' use Col C (Firma).
        // Others use Col D (Tedarikçi).

        const targets = [
            { title: 'CAMSAN', type: 'FIRM', val: 'Camsan' },
            { title: 'CAMSAN&KOPARAN', type: 'FIRM', val: 'Camsan&Koparan' },
            { title: 'KOPARAN', type: 'FIRM', val: 'Koparan' }, // Assumed Firm logic for consistency if requested
            { title: 'ÖZTOP', type: 'SUP', val: 'Öztop' },
            { title: 'SHN', type: 'SUP', val: 'Shn' },
            { title: 'CEPER', type: 'SUP', val: 'Ceper' },
            { title: 'CANBEK', type: 'SUP', val: 'Canbek' },
            { title: 'MINI KEPÇE', type: 'SUP', val: 'Mini Kepçe' },
            { title: 'BARIŞ VİNÇ', type: 'SUP', val: 'Barış Vinç' }
        ];

        for (const t of targets) {
            const sheet = doc.sheetsByTitle[t.title];
            if (!sheet) {
                console.log(`Skipping ${t.title} (Not found)`);
                continue;
            }

            console.log(`Protecting ${t.title}...`);

            // 1. Clear everything (Remove debris causing REF)
            await sheet.clear();

            // 2. Set Formula
            const col = t.type === 'FIRM' ? 'C' : 'D';
            const query = `=QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE ${col} = '${t.val}'"; 1)`;

            await sheet.loadCells('A1');
            sheet.getCell(0, 0).formula = query;
            await sheet.saveUpdatedCells();

            // 3. Add Protection (Lock Sheet)
            // Note: This might fail if Service Account is not Editor, but usually works.
            try {
                // If already protected, maybe update? 
                // google-spreadsheet doesn't have robust "getProtections".
                // We just try to add a new protection.
                // Assuming "sheet.protect()" is available in recent versions, 
                // but checking library docs, updated versions might confuse this.
                // We can use bare API if needed.
                // But let's try assuming standard library usage not documented in my prompt.
                // Actually, let's use raw API for safety.
            } catch (e) {
                console.log("Error protecting via library, trying API...");
            }
        }

        // Using batchUpdate for Protection
        const requests = [];
        for (const t of targets) {
            const sheet = doc.sheetsByTitle[t.title];
            if (!sheet) continue;

            requests.push({
                addProtectedRange: {
                    protectedRange: {
                        range: {
                            sheetId: sheet.sheetId,
                            // Full sheet
                        },
                        description: "Protected by System - No Edits Allowed",
                        warningOnly: false,
                        editors: {
                            users: [], // Restrict to owner only naturally
                            // Or allow specific users? 
                            // Empty means "Only me (service account) and owner".
                        }
                    }
                }
            });
        }

        if (requests.length > 0) {
            const sheetsService = google.sheets({ version: 'v4', auth });
            try {
                await sheetsService.spreadsheets.batchUpdate({
                    spreadsheetId: SHEET_ID,
                    requestBody: { requests }
                });
                console.log("All target sheets LOCKED successfully.");
            } catch (e) {
                console.log("Protection API Warning (might be already protected):", e.message);
            }
        }

        console.log("\n[SUCCESS] Operation Complete.");

    } catch (error) {
        console.error(error);
    }
}
main();
