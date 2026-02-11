
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

        // Targets
        const targets = [
            'CAMSAN', 'CAMSAN&KOPARAN', 'KOPARAN',
            'ÖZTOP', 'SHN', 'CEPER', 'CANBEK', 'MINI KEPÇE', 'BARIŞ VİNÇ'
        ];

        // We need to apply DataValidation (Checkbox) to Column A (Index 0) for Rows 2:1000
        // WITHOUT putting any data in the cell. Just "Rule".
        // This makes "FALSE" appear as Unchecked Box, "TRUE" as Checked Box.

        const requests = [];

        for (const title of targets) {
            const sheet = doc.sheetsByTitle[title];
            if (!sheet) continue;

            console.log(`Formatting checkboxes for ${title}...`);

            // 1. Apply Checkbox Validation to A2:A
            requests.push({
                setDataValidation: {
                    range: {
                        sheetId: sheet.sheetId,
                        startRowIndex: 1, // Skip Header A1
                        endRowIndex: 1000,
                        startColumnIndex: 0,
                        endColumnIndex: 1
                    },
                    rule: {
                        condition: { type: "BOOLEAN" },
                        showCustomUi: true
                    }
                }
            });

            // 2. Also center align it for looks
            requests.push({
                repeatCell: {
                    range: {
                        sheetId: sheet.sheetId,
                        startRowIndex: 1, endRowIndex: 1000,
                        startColumnIndex: 0, endColumnIndex: 1
                    },
                    cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
                    fields: "userEnteredFormat.horizontalAlignment"
                }
            });
        }

        if (requests.length > 0) {
            await sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: { requests }
            });
            console.log("[SUCCESS] Checkbox formatting applied to all supplier sheets.");
        }

    } catch (error) {
        console.error(error);
    }
}
main();
