
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// 1. Manually Load .env.local
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

    // Auth Client
    const auth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk';
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        // 1. Get Sheet ID for 'VERİ GİRİŞİ'
        const doc = new GoogleSpreadsheet(SHEET_ID, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['VERİ GİRİŞİ'];

        if (!sheet) {
            throw new Error("'VERİ GİRİŞİ' sayfası bulunamadı!");
        }

        console.log(`-> Found 'VERİ GİRİŞİ' (ID: ${sheet.sheetId})`);

        // 2. Prepare Batch Update
        // Insert 2 columns at Index 12 (Column M) -> New M and N
        const requests = [
            {
                insertDimension: {
                    range: {
                        sheetId: sheet.sheetId,
                        dimension: "COLUMNS",
                        startIndex: 12,
                        endIndex: 14 // 12 and 13 (2 columns)
                    },
                    inheritFromBefore: true // Inherit format from L (BİRİM FİYATI)
                }
            },
            {
                updateCells: {
                    range: {
                        sheetId: sheet.sheetId,
                        startRowIndex: 0,
                        endRowIndex: 1,
                        startColumnIndex: 12,
                        endColumnIndex: 14
                    },
                    rows: [
                        {
                            values: [
                                { userEnteredValue: { stringValue: "TUTAR" } },
                                { userEnteredValue: { stringValue: "KDV" } }
                            ]
                        }
                    ],
                    fields: "userEnteredValue"
                }
            }
        ];

        console.log("-> Sending Batch Update (Insert Columns + Set Headers)...");
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests }
        });

        console.log("\n[SUCCESS] Columns 'TUTAR' and 'KDV' added successfully between L and M!");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
