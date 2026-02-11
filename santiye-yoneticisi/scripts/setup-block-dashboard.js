
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

        // --- 1. EXTRACT DATA (Enhanced) ---
        // We will try to pull Contact info too if available in the Block Header
        const companies = [
            { nameRow: 5, dataRows: [6, 7] },
            { nameRow: 14, dataRows: [15, 16] },
            { nameRow: 24, dataRows: [25, 26] },
            { nameRow: 34, dataRows: [35, 36] }
        ];

        const dbRows = [];
        const today = new Date().toLocaleDateString('tr-TR');

        for (const comp of companies) {
            const companyName = sourceSheet.getCell(comp.nameRow, 1).value; // B
            const contactPhone = sourceSheet.getCell(comp.nameRow, 2).value || ""; // C
            const contactName = sourceSheet.getCell(comp.nameRow, 3).value || ""; // D
            const category = sourceSheet.getCell(comp.nameRow, 4).value; // E (Product Category Header)

            for (const rIndex of comp.dataRows) {
                const detail = sourceSheet.getCell(rIndex, 4).value; // E
                const price = sourceSheet.getCell(rIndex, 8).value;  // I
                const delivery = sourceSheet.getCell(rIndex, 7).value || "DAHİL"; // H
                const payment = sourceSheet.getCell(rIndex, 5).value || "PEŞİN"; // F

                if (detail && price) {
                    dbRows.push([
                        today,
                        companyName,
                        contactPhone,
                        contactName,
                        category + " " + detail, // Combine for Full Product Name
                        payment,
                        "", // Teslim Tarihi (Empty for now)
                        delivery,
                        price,
                        "Ton" // Unit
                    ]);
                }
            }
        }

        // --- 2. SETUP 'FİYAT_VERİTABANI' ---
        let dbSheet = doc.sheetsByTitle['FİYAT_VERİTABANI2']; // Use V2 to avoid conflict/ensure clean slate
        if (!dbSheet) {
            dbSheet = await doc.addSheet({ title: 'FİYAT_VERİTABANI2' });
        } else {
            await dbSheet.clear();
        }

        // Columns Map: 
        // A: Tarih, B: Firma, C: Tel, D: Yetkili, E: Ürün, F: Ödeme, G: Teslim Tarihi, H: Nakliye, I: Fiyat, J: Birim
        await dbSheet.setHeaderRow(['TARİH', 'FİRMA', 'İRTİBAT', 'YETKİLİ', 'ÜRÜN', 'ÖDEME', 'TESLİM TARİHİ', 'NAKLİYE', 'BİRİM FİYAT', 'BİRİM']);
        await dbSheet.addRows(dbRows);

        // --- 3. SETUP 'KARŞILAŞTIRMA_BLOCK' ---
        let dashSheet = doc.sheetsByTitle['KARŞILAŞTIRMA_BLOCK'];
        if (!dashSheet) {
            dashSheet = await doc.addSheet({ title: 'KARŞILAŞTIRMA_BLOCK' });
        } else {
            await dashSheet.clear();
        }

        // --- 4. DISPLAY LOGIC (The Hard Part) ---
        // We want to read DB and group by Company. But using Filter/Query functions is better than static script writing
        // because it updates automatically!

        // However, the User wants a specific "Block" layout:
        // Header Row (merged?)
        // Data Rows
        // Spacer
        // Header Row
        // ...

        // Formula Approach: Hard to do complex blocks with pure formulas.
        // Script Approach: Writes the structure ONCE. User has to re-run script to update? No, that sucks.
        // Hybrid: The script sets up a query for each company.

        // Let's create a visual structure that LISTS unique companies in Col A (Hidden), and uses mapped formulas to render the blocks.
        // Actually, just listing them sorted by Product makes comparison easier?
        // User wants Company Blocks.

        // Let's write a script that generates the STATIC BLOCKS for now based on current DB.
        // If they add a row to DB, they might need to run "Update Dashboard" (slash command I can add).
        // This gives the best visual control.

        await dashSheet.loadCells('A1:L100');

        // Headers
        const headers = ["NO", "FİRMA", "İRTİBAT", "YETKİLİ", "ÜRÜN AÇIKLAMASI", "ÖDEME", "TESLİM TARİHİ", "NAKLİYE", "BİRİM FİYAT", "MİKTAR", "BİRİM", "TUTAR"];
        // Write Global Header
        dashSheet.getCell(1, 4).value = "FİYAT KARŞILAŞTIRMA";
        dashSheet.getCell(1, 4).textFormat = { bold: true, fontSize: 16 };

        for (let i = 0; i < headers.length; i++) {
            const cell = dashSheet.getCell(3, i); // Row 4
            cell.value = headers[i];
            cell.textFormat = { bold: true };
            cell.backgroundColor = { red: 0.9, green: 0.9, blue: 0.9 };
            cell.borders = { bottom: { style: "SOLID" } };
        }

        // Group DB by Company
        const companiesMap = {};
        dbRows.forEach(row => {
            const cName = row[1];
            if (!companiesMap[cName]) companiesMap[cName] = { info: row, items: [] };
            companiesMap[cName].items.push(row);
        });

        let currentRow = 5; // Start writing at Row 6
        let compIndex = 1;

        for (const cName in companiesMap) {
            const cData = companiesMap[cName];
            const firstRow = cData.items[0];

            // 1. Company Header Row
            dashSheet.getCell(currentRow, 0).value = compIndex;
            dashSheet.getCell(currentRow, 1).value = cData.info[1]; // Name
            dashSheet.getCell(currentRow, 1).textFormat = { bold: true };

            dashSheet.getCell(currentRow, 2).value = cData.info[2]; // Tel
            dashSheet.getCell(currentRow, 3).value = cData.info[3]; // Yetkili

            // Other columns blank or summary?

            currentRow++;

            // 2. Item Rows
            for (const item of cData.items) {
                // Columns: 
                // E: Ürün (Index 4)
                // F: Ödeme (5)
                // G: Teslim (6)
                // H: Nakliye (7)
                // I: Fiyat (8)
                // K: Birim (10)

                dashSheet.getCell(currentRow, 4).value = item[4]; // Product
                dashSheet.getCell(currentRow, 5).value = item[5]; // Payment
                dashSheet.getCell(currentRow, 6).value = item[6]; // Delivery Date
                dashSheet.getCell(currentRow, 7).value = item[7]; // Delivery Terms
                dashSheet.getCell(currentRow, 8).value = item[8]; // Price
                dashSheet.getCell(currentRow, 10).value = item[9]; // Unit

                currentRow++;
            }

            // Spacer
            currentRow++;
            compIndex++;
        }

        // 5. CONDITIONAL FORMATTING (Green Light)
        // Highlight Price (Col I) if it's the Minimum for that Product (Col E)
        // Range: I6:I1000
        // Formula: =I6=MINIFS($I$6:$I$1000; $E$6:$E$1000; $E6)

        const reqs = [{
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: dashSheet.sheetId, startRowIndex: 5, endRowIndex: 1000, startColumnIndex: 8, endColumnIndex: 9 }], // Col I
                    booleanRule: {
                        condition: {
                            type: "CUSTOM_FORMULA",
                            // Check if cell is not empty AND is min
                            values: [{ userEnteredValue: `=AND(I6<>""; I6=MINIFS($I$6:$I$1000; $E$6:$E$1000; $E6))` }]
                        },
                        format: {
                            backgroundColor: { red: 0.7, green: 0.9, blue: 0.7 }, // Green
                            textFormat: { bold: true }
                        }
                    }
                },
                index: 0
            }
        }];

        await dashSheet.saveUpdatedCells();

        const sheetsService = google.sheets({ version: 'v4', auth });
        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests: reqs }
        });

        console.log("\n[SUCCESS] Block Dashboard generated.");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error('Reason:', error.message);
    }
}

main();
