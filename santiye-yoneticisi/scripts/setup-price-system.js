
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Load .env
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

    const SHEET_ID = '1Ig3EwLNfaB4f1bC1JhuY7oMsis8ZnE1Fdi-gCftvIwc';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const sourceSheet = doc.sheetsByIndex[1]; // "30.01.2026"
        console.log(`-> Reading Source: ${sourceSheet.title}`);
        await sourceSheet.loadCells('A1:L50');

        // --- 1. EXTRACT DATA ---
        const companies = [
            { nameRow: 5, dataRows: [6, 7] },   // ÖZTOP (Index 5 is Row 6)
            { nameRow: 14, dataRows: [15, 16] }, // FAAT (Index 14 is Row 15)
            { nameRow: 24, dataRows: [25, 26] }, // SHN
            { nameRow: 34, dataRows: [35, 36] }  // SİRAÇ
        ];

        const dbRows = [];
        const today = new Date().toLocaleDateString('tr-TR');

        for (const comp of companies) {
            const companyName = sourceSheet.getCell(comp.nameRow, 1).value; // Col B
            const category = sourceSheet.getCell(comp.nameRow, 4).value;    // Col E (İnşaat Demiri)

            for (const rIndex of comp.dataRows) {
                const detail = sourceSheet.getCell(rIndex, 4).value; // Col E
                const price = sourceSheet.getCell(rIndex, 8).value;  // Col I

                if (detail && price) {
                    dbRows.push([
                        today,       // Tarih
                        companyName, // Firma
                        category,    // Ürün
                        detail,      // Detay
                        price,       // Fiyat
                        "Ton",       // Birim (Hardcoded for now based on context)
                        "DAHİL"      // Nakliye (Assuming Dahil based on headers)
                    ]);
                }
            }
        }
        console.log(`-> Extracted ${dbRows.length} rows of data.`);

        // --- 2. SETUP 'FİYAT_VERİTABANI' ---
        let dbSheet = doc.sheetsByTitle['FİYAT_VERİTABANI'];
        if (!dbSheet) {
            console.log("-> Creating 'FİYAT_VERİTABANI'...");
            dbSheet = await doc.addSheet({ title: 'FİYAT_VERİTABANI' });
        } else {
            console.log("-> Clearing 'FİYAT_VERİTABANI'...");
            await dbSheet.clear();
        }

        // Write Headers & Data
        await dbSheet.setHeaderRow(['TARİH', 'FİRMA', 'ÜRÜN', 'DETAY', 'BİRİM FİYAT', 'BİRİM', 'NAKLİYE']);
        await dbSheet.addRows(dbRows);

        // --- 3. SETUP 'KARŞILAŞTIRMA_DASHBOARD' ---
        let dashSheet = doc.sheetsByTitle['KARŞILAŞTIRMA_DASHBOARD'];
        if (!dashSheet) {
            console.log("-> Creating 'KARŞILAŞTIRMA_DASHBOARD'...");
            dashSheet = await doc.addSheet({ title: 'KARŞILAŞTIRMA_DASHBOARD' });
        } else {
            console.log("-> Clearing 'KARŞILAŞTIRMA_DASHBOARD'...");
            await dashSheet.clear();
        }

        // --- 4. FORMULAS FOR DASHBOARD ---
        // A1: Title
        await dashSheet.loadCells('A1:Z50');
        dashSheet.getCell(0, 0).value = "FİYAT KARŞILAŞTIRMA PANOSU";
        dashSheet.getCell(0, 0).textFormat = { bold: true, fontSize: 14 };

        // Matrix Formulas (Using semicolon for Turkish Locale assumptions since previous sheet was Turkish)
        // A3: Dynamic Products List (=UNIQUE(Product + Detail))
        // Actually, let's just list Product and Detail columns

        dashSheet.getCell(2, 0).value = "ÜRÜN";
        dashSheet.getCell(2, 1).value = "DETAY";

        // A4: Formula to get unique Product|Detail pairs
        // =UNIQUE(QUERY(FİYAT_VERİTABANI!C:D; "SELECT C, D WHERE C IS NOT NULL label C '', D ''"))
        // Simplified: =UNIQUE('FİYAT_VERİTABANI'!C2:D)
        dashSheet.getCell(3, 0).formula = "=UNIQUE('FİYAT_VERİTABANI'!C2:D)";

        // C2: Dynamic Company Headers (Transposed)
        // =TRANSPOSE(UNIQUE('FİYAT_VERİTABANI'!B2:B))
        dashSheet.getCell(1, 2).formula = "=TRANSPOSE(UNIQUE('FİYAT_VERİTABANI'!B2:B))";

        // C4: Matrix Value Formula (The Magic)
        // We can't put a formula in every cell easily via script without looping.
        // But we can use a MAP or MAKEARRAY if available, or just standard SUMIFS.
        // Let's explicitly write SUMIFS formula in C4 and drag it? 
        // Better: Use a single cell array formula if possible. 
        // =MAP(A4:A; B4:B; LAMBDA(p; d; IF(p="";""; ...))) - Complex.

        // Simpler: Fill a 10x10 grid with SUMIFS for now.
        // Cell C4 Formula: =IF(OR($A4=""; C$2=""); ""; SUMIFS('FİYAT_VERİTABANI'!$E:$E; 'FİYAT_VERİTABANI'!$B:$B; C$2; 'FİYAT_VERİTABANI'!$C:$C; $A4; 'FİYAT_VERİTABANI'!$D:$D; $B4))
        // We will apply this to a range C4:H20 (Accommodating up to 6 companies, 17 items)

        const formulaTemplate = `=IF(OR($A4=""; C$2=""); ""; SUMIFS('FİYAT_VERİTABANI'!$E:$E; 'FİYAT_VERİTABANI'!$B:$B; C$2; 'FİYAT_VERİTABANI'!$C:$C; $A4; 'FİYAT_VERİTABANI'!$D:$D; $B4))`;

        const gridRequests = [];

        // Apply formula to C4:J20 (8 companies x 17 rows)
        gridRequests.push({
            repeatCell: {
                range: {
                    sheetId: dashSheet.sheetId,
                    startRowIndex: 3, endRowIndex: 20, // Row 4 to 20
                    startColumnIndex: 2, endColumnIndex: 10 // Col C to J
                },
                cell: { userEnteredValue: { formulaValue: formulaTemplate } },
                fields: "userEnteredValue"
            }
        });

        // Date Check: Just in case SUMIFS returns 0 for non-matches, we might want clean display.
        // The IF wrapper handles empty headers/rows.

        // CONDITIONAL FORMATTING: Green for lowest > 0
        // Formula: =C4=MINIFS($C4:$J4; $C4:$J4; ">0")
        const formattingRequest = {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: dashSheet.sheetId, startRowIndex: 3, endRowIndex: 20, startColumnIndex: 2, endColumnIndex: 10 }],
                    booleanRule: {
                        condition: {
                            type: "CUSTOM_FORMULA",
                            values: [{ userEnteredValue: `=C4=MINIFS($C4:$J4; $C4:$J4; ">0")` }]
                        },
                        format: {
                            backgroundColor: { red: 0.85, green: 0.95, blue: 0.85 }, // Light Green
                            textFormat: { bold: true, foregroundColor: { red: 0, green: 0.5, blue: 0 } }
                        }
                    }
                },
                index: 0
            }
        };

        gridRequests.push(formattingRequest);

        await dashSheet.saveUpdatedCells(); // Save titles/headers first

        // Execute Batch for formulas + formatting
        const sheetsService = google.sheets({ version: 'v4', auth });
        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests: gridRequests }
        });

        console.log("\n[SUCCESS] System setup complete!");
        console.log("1. 'FİYAT_VERİTABANI' created and populated.");
        console.log("2. 'KARŞILAŞTIRMA_DASHBOARD' created with auto-matrix and highlighting.");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
        if (error.response) console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
}

main();
