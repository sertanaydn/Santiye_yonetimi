
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
        const sheet = doc.sheetsByTitle['VERİ GİRİŞİ'];
        if (!sheet) return;

        console.log("-> Adding 'ONAY' Checkbox Column to 'VERİ GİRİŞİ'...");

        const sheetsService = google.sheets({ version: 'v4', auth });

        // 1. Insert Column A
        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [{
                    insertDimension: {
                        range: {
                            sheetId: sheet.sheetId,
                            dimension: "COLUMNS",
                            startIndex: 0,
                            endIndex: 1
                        },
                        inheritFromBefore: false
                    }
                }]
            }
        });

        // 2. Set Header "ONAY" and Checkboxes
        await sheet.loadCells('A1:A1000');
        const header = sheet.getCell(0, 0);
        header.value = "ONAY";
        header.textFormat = { bold: true };

        const checkboxReq = {
            repeatCell: {
                range: {
                    sheetId: sheet.sheetId,
                    startRowIndex: 1, endRowIndex: 1000,
                    startColumnIndex: 0, endColumnIndex: 1
                },
                cell: { dataValidation: { condition: { type: "BOOLEAN" } } },
                fields: "dataValidation"
            }
        };

        // 3. Add Slicers with CORRECT structure
        // Slicer 1: FİRMA (Col C, Index 2 now)
        const slicerReq1 = {
            addSlicer: {
                slicer: {
                    spec: {
                        dataRange: { sheetId: sheet.sheetId, startRowIndex: 0, startColumnIndex: 0 },
                        filterCriteria: { condition: { type: "NOT_BLANK" } },
                        columnIndex: 2, // FİRMA
                        title: "FİRMA FİLTRESİ"
                    },
                    position: {
                        overlayPosition: {
                            anchorCell: { sheetId: sheet.sheetId, rowIndex: 0, columnIndex: 2 }
                        }
                    }
                }
            }
        };

        // Slicer 2: TEDARİKÇİ (Col D, Index 3 now)
        const slicerReq2 = {
            addSlicer: {
                slicer: {
                    spec: {
                        dataRange: { sheetId: sheet.sheetId, startRowIndex: 0, startColumnIndex: 0 },
                        columnIndex: 3, // TEDARİKÇİ
                        title: "TEDARİKÇİ FİLTRESİ"
                    },
                    position: {
                        overlayPosition: {
                            anchorCell: { sheetId: sheet.sheetId, rowIndex: 0, columnIndex: 4 }
                        }
                    }
                }
            }
        };

        await sheet.saveUpdatedCells();

        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: {
                requests: [checkboxReq, slicerReq1, slicerReq2]
            }
        });

        console.log("\n[SUCCESS] 'ONAY' column and Slicers added to 'VERİ GİRİŞİ'.");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

main();
