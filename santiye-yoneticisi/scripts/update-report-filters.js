
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

    // Auth Client for Batch Updates
    const auth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1UYmdZDx1CDj_Ja64Y8yZxon95Cai4EeEuZBnrd61qfk';
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const doc = new GoogleSpreadsheet(SHEET_ID, auth);
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['RAPOR'];

        if (!sheet) {
            throw new Error("'RAPOR' sayfası bulunamadı!");
        }

        console.log(`-> Updating filters in 'RAPOR' (ID: ${sheet.sheetId})...`);

        // Update Formula A4
        // Columns in VERİ GİRİŞİ:
        // B: Firma
        // C: Tedarikçi
        // H: Makine / Malzeme
        // I: Detay
        // Filters in RAPOR:
        // C1: Firma Input
        // F1: Tedarikçi Input
        // J1: Makine / Malzeme Input (Target)
        // M1: Detay Input (Target)

        // Turkish locale: Use semicolons (;)
        const newFormula = `=FILTER('VERİ GİRİŞİ'!A:P; (IF(C1=""; TRUE; 'VERİ GİRİŞİ'!B:B = C1)) * (IF(F1=""; TRUE; 'VERİ GİRİŞİ'!C:C = F1)) * (IF(J1=""; TRUE; 'VERİ GİRİŞİ'!H:H = J1)) * (IF(M1=""; TRUE; 'VERİ GİRİŞİ'!I:I = M1)))`;

        const requests = [
            // 1. Set Labels (I1: Makine, L1: Detay)
            {
                updateCells: {
                    range: { sheetId: sheet.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 8, endColumnIndex: 9 }, // I1 (Col 8)
                    rows: [{ values: [{ userEnteredValue: { stringValue: "MAKİNE / MALZEME" }, userEnteredFormat: { textFormat: { bold: true }, horizontalAlignment: "RIGHT" } }] }],
                    fields: "userEnteredValue,userEnteredFormat"
                }
            },
            {
                updateCells: {
                    range: { sheetId: sheet.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 11, endColumnIndex: 12 }, // L1 (Col 11)
                    rows: [{ values: [{ userEnteredValue: { stringValue: "DETAY" }, userEnteredFormat: { textFormat: { bold: true }, horizontalAlignment: "RIGHT" } }] }],
                    fields: "userEnteredValue,userEnteredFormat"
                }
            },
            // 2. Set Dropdowns (Data Validation) for J1 and M1
            // We assume ranges in TANIMLAR sheet or VERİ GİRİŞİ unique values. 
            // Better to use 'VERİ GİRİŞİ' range to ensure we filter by what exists? 
            // Or 'TANIMLAR' definition columns? 
            // Looking at the CSV analysis earlier, 'TANIMLAR' likely has these lists.
            // Let's assume standard 'TANIMLAR' ranges or just open input for now if we don't know the exact range IDs.
            // To be safe and avoid broken ranges, we'll set the cell background to indicate input but maybe skip strict validation if we don't have the range.
            // Wait, I can see TANIMLAR sheet ID by loading it.

            // Let's just create formatting for J1 and M1 first (Input styling)
            {
                updateCells: {
                    range: { sheetId: sheet.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 9, endColumnIndex: 10 }, // J1
                    rows: [{ values: [{ userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } }] }], // Light Grey like others
                    fields: "userEnteredFormat"
                }
            },
            {
                updateCells: {
                    range: { sheetId: sheet.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 12, endColumnIndex: 13 }, // M1
                    rows: [{ values: [{ userEnteredFormat: { backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } } }] }],
                    fields: "userEnteredFormat"
                }
            },

            // 3. Update Formula in A4
            {
                updateCells: {
                    range: { sheetId: sheet.sheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 1 }, // A4
                    rows: [{ values: [{ userEnteredValue: { formulaValue: newFormula } }] }],
                    fields: "userEnteredValue"
                }
            }
        ];

        console.log("-> Sending Batch Update...");
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests }
        });

        console.log("\n[SUCCESS] Filters added to I1/J1 and L1/M1 and formula updated.");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
