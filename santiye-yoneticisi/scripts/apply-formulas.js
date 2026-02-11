
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
        const sheet = doc.sheetsByTitle['VERİ GİRİŞİ'];

        if (!sheet) {
            throw new Error("'VERİ GİRİŞİ' sayfası bulunamadı!");
        }

        console.log(`-> Applying formulas to 'VERİ GİRİŞİ' (ID: ${sheet.sheetId})...`);

        // Formulas
        // M: TUTAR = J * L (Miktar * Birim Fiyat)
        // N: KDV = IF(H="İnşaat Demiri", M*1%, M*20%)
        // O: TOPLAM = M + N

        const requests = [{
            repeatCell: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 1, // Skip Header (Row 0)
                    endRowIndex: 1000, // Apply to 1000 rows
                    startColumnIndex: 12, // Col M (Index 12)
                    endColumnIndex: 15    // Col O (Index 14) -> End is exclusive so 15 means up to O
                },
                cell: {
                    userEnteredValue: {
                        // This won't work for different formulas in different columns in one go with repeatCell specific value
                        // repeatedCell is for IDENTICAL cells.
                        // We need to use updateCells or pasteData for bulk, or just iterate (slow).
                        // BETTER APPROACH: Use 'updateCells' with 3 columns of data, but that requires constructing the big array.
                        // ALTERNATIVE: Use 3 separate repeatCell requests? No, repeatCell applies ONE value to rectangle.
                        // We have 3 different formulas.
                        // Correct way: Use 'copyPaste' ?? No.
                        // Correct way: set formula for Row 2, then 'autoFill' ?? Yes!
                    }
                },
                fields: "userEnteredValue"
            }
        }];

        // Strategy: Write formulas to Row 2, then AutoFill down to Row 1000.

        // 1. Update Row 2 (M2, N2, O2)
        const updateRow2Request = {
            updateCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 1,
                    endRowIndex: 2,
                    startColumnIndex: 12, // M
                    endColumnIndex: 15    // O (exclusive -> M, N, O)
                },
                rows: [
                    {
                        values: [
                            { userEnteredValue: { formulaValue: "=J2*L2" } }, // M2: Tutar
                            // FIX: Using semicolons (;) for Turkish locale support
                            // Also using 1% and 20% to avoid dot vs comma decimal issues
                            { userEnteredValue: { formulaValue: "=IF(H2=\"İnşaat Demiri\"; M2*1%; M2*20%)" } },
                            { userEnteredValue: { formulaValue: "=M2+N2" } }  // O2: Toplam
                        ]
                    }
                ],
                fields: "userEnteredValue"
            }
        };

        // 2. AutoFill to Row 1000
        const autoFillRequest = {
            autoFill: {
                useAlternateSeries: false,
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 1, // Row 2
                    endRowIndex: 1000,
                    startColumnIndex: 12, // M
                    endColumnIndex: 15    // O
                }
            }
        };

        // 3. Update Header for Column O (renaming to ÖDENECEK TUTAR)
        const updateHeaderRequest = {
            updateCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 14, // O
                    endColumnIndex: 15
                },
                rows: [{ values: [{ userEnteredValue: { stringValue: "ÖDENECEK TUTAR" } }] }],
                fields: "userEnteredValue"
            }
        };

        // 4. Update Header for Column N (renaming to KDV TUTARI based on prompt)
        const updateHeaderKdv = {
            updateCells: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 13, // N
                    endColumnIndex: 14
                },
                rows: [{ values: [{ userEnteredValue: { stringValue: "KDV TUTARI" } }] }],
                fields: "userEnteredValue"
            }
        };


        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [
                    updateRow2Request,
                    autoFillRequest,
                    updateHeaderRequest,
                    updateHeaderKdv
                ]
            }
        });

        console.log("\n[BASIC SUCCESS] Formüller uygulandı (M, N, O).");
        console.log(" - İnşaat Demiri: %1 KDV");
        console.log(" - Diğerleri: %20 KDV (Varsayılan)");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

main();
