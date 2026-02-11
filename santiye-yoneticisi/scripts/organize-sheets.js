
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
        const sheetsService = google.sheets({ version: 'v4', auth });

        // 1. Delete Junk Sheets
        const junk = ['Sayfa5', 'Sheet1'];
        const requests = [];

        junk.forEach(title => {
            const sheet = doc.sheetsByTitle[title];
            if (sheet) {
                console.log(`Deleting junk sheet: ${title}`);
                requests.push({ deleteSheet: { sheetId: sheet.sheetId } });
            }
        });

        // 2. Reorder Sheets
        // Desired Order: VERİ GİRİŞİ, RAPOR, TANIMLAR, [Suppliers A-Z]
        const mainSheets = ['VERİ GİRİŞİ', 'RAPOR', 'TANIMLAR', 'BETON'];
        const currentTitles = doc.sheetsByIndex.map(s => s.title);

        const suppliers = currentTitles.filter(t => !mainSheets.includes(t) && !junk.includes(t)).sort();
        const finalOrder = [...mainSheets, ...suppliers];

        console.log("Sorting Sheets:", finalOrder);

        // We have to update index for EACH sheet.
        // Google Sheets API applies updates sequentially.
        // Easiest is to set index 0, 1, 2...

        finalOrder.forEach((title, index) => {
            const sheet = doc.sheetsByTitle[title];
            if (sheet) {
                requests.push({
                    updateSheetProperties: {
                        properties: { sheetId: sheet.sheetId, index: index },
                        fields: "index"
                    }
                });
            }
        });

        if (requests.length > 0) {
            await sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: { requests }
            });
            console.log("[SUCCESS] Sheets reorganized.");
        } else {
            console.log("Nothing to change.");
        }

    } catch (error) {
        console.error(error);
    }
}
main();
