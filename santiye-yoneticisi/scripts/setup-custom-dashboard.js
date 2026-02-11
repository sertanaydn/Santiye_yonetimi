
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

        let dbSheet = doc.sheetsByTitle['FİYAT_VERİTABANI2'];
        if (!dbSheet) { console.error("DB Not found, please run setup-price-system.js first"); return; }
        const dbRows = await dbSheet.getRows();

        let dashSheet = doc.sheetsByTitle['KARŞILAŞTIRMA_BLOCK_V2'];
        if (!dashSheet) {
            dashSheet = await doc.addSheet({ title: 'KARŞILAŞTIRMA_BLOCK_V2' });
        } else {
            await dashSheet.clear();
        }

        console.log("-> Generating Custom Block Layout...");

        // --- 1. HEADERS ---
        const headers = [
            "FİRMA", "İRTİBAT NUMARALARI", "FİRMA YETKİLİSİ", "ÜRÜN AÇIKLAMASI",
            "ÖDEME", "TESLİM TARİHİ", "NAKLİYE",
            "MALZEME BİRİM FİYATI", "MİKTAR", "BİRİM",
            "TUTAR", "KDV ORANI", "KDV", "YEKÜN"
        ];

        await dashSheet.loadCells('A1:O5');
        dashSheet.getCell(1, 5).value = "FİYAT KARŞILAŞTIRMA - DETAYLI"; // Title
        dashSheet.getCell(1, 5).textFormat = { bold: true, fontSize: 18 };

        dashSheet.getCell(1, 13).value = "SİPARİŞ TARİHİ";
        dashSheet.getCell(2, 13).value = new Date().toLocaleDateString('tr-TR');
        dashSheet.getCell(1, 13).borders = { bottom: { style: "SOLID" }, right: { style: "SOLID" }, left: { style: "SOLID" }, top: { style: "SOLID" } };
        dashSheet.getCell(2, 13).borders = { bottom: { style: "SOLID" }, right: { style: "SOLID" }, left: { style: "SOLID" } };

        for (let i = 0; i < headers.length; i++) {
            const cell = dashSheet.getCell(4, i + 1); // Row 5
            cell.value = headers[i];
            cell.textFormat = { bold: true, fontSize: 10 };
            cell.backgroundColor = { red: 0.95, green: 0.95, blue: 0.95 };
            cell.borders = { bottom: { style: "SOLID" }, top: { style: "SOLID" }, left: { style: "SOLID" }, right: { style: "SOLID" } };
            cell.horizontalAlignment = "CENTER";
            cell.verticalAlignment = "MIDDLE";
            // Skipping width update in loop to prevent errors, rely on default or batch later
        }

        // --- 2. DATA BLOCKS ---
        const companiesMap = {};
        dbRows.forEach(row => {
            const raw = row.toObject();
            const cName = raw['FİRMA'];
            if (!companiesMap[cName]) companiesMap[cName] = {
                irtibat: raw['İRTİBAT'] || "",
                yetkili: raw['YETKİLİ'] || "",
                items: []
            };
            companiesMap[cName].items.push(raw);
        });

        const START_ROW = 5;
        const TOTAL_ROWS = Object.keys(companiesMap).length * 15;

        await dashSheet.loadCells({ startRowIndex: START_ROW, endRowIndex: START_ROW + TOTAL_ROWS, startColumnIndex: 0, endColumnIndex: 16 });

        let currentRow = START_ROW;
        let compCounter = 1;

        for (const cName in companiesMap) {
            const info = companiesMap[cName];
            const startBlockRow = currentRow;

            const cIndexCell = dashSheet.getCell(currentRow, 0);
            cIndexCell.value = compCounter;
            cIndexCell.horizontalAlignment = "CENTER";
            cIndexCell.verticalAlignment = "MIDDLE";

            const cNameCell = dashSheet.getCell(currentRow, 1);
            cNameCell.value = cName;
            cNameCell.textFormat = { bold: true };

            const cPhoneCell = dashSheet.getCell(currentRow, 2);
            cPhoneCell.value = info.irtibat;

            const cAuthCell = dashSheet.getCell(currentRow, 3);
            cAuthCell.value = info.yetkili;

            for (const item of info.items) {
                const prodCell = dashSheet.getCell(currentRow, 4);
                prodCell.value = item['ÜRÜN'];

                dashSheet.getCell(currentRow, 5).value = item['ÖDEME'];
                dashSheet.getCell(currentRow, 6).value = item['TESLİM TARİHİ'];
                dashSheet.getCell(currentRow, 7).value = item['NAKLİYE'];

                // Safe Price Handling
                let rawPrice = item['BİRİM FİYAT'];
                dashSheet.getCell(currentRow, 8).value = rawPrice;

                // Default Quantity
                dashSheet.getCell(currentRow, 9).value = 1;
                dashSheet.getCell(currentRow, 10).value = item['BİRİM'];

                const r = currentRow + 1;
                // Formulas using A1 notation
                dashSheet.getCell(currentRow, 11).formula = `=I${r}*J${r}`; // Tutar
                dashSheet.getCell(currentRow, 12).value = 0.20;
                dashSheet.getCell(currentRow, 12).numberFormat = { type: 'PERCENT' };
                dashSheet.getCell(currentRow, 13).formula = `=L${r}*M${r}`; // KDV
                dashSheet.getCell(currentRow, 14).formula = `=L${r}+N${r}`; // Yekun

                currentRow++;
            }

            const totalLabel = dashSheet.getCell(currentRow, 13);
            totalLabel.value = "TOPLAM:";
            totalLabel.textFormat = { bold: true };
            totalLabel.horizontalAlignment = "RIGHT";

            const totalSum = dashSheet.getCell(currentRow, 14);
            totalSum.formula = `=SUM(O${startBlockRow + 1}:O${currentRow})`;
            totalSum.textFormat = { bold: true };

            currentRow++;
            compCounter++;
        }

        // --- 3. CONDITIONAL FORMATTING ---
        const formatReq = {
            addConditionalFormatRule: {
                rule: {
                    ranges: [{ sheetId: dashSheet.sheetId, startRowIndex: 5, endRowIndex: 1000, startColumnIndex: 8, endColumnIndex: 9 }], // Col I
                    booleanRule: {
                        condition: {
                            type: "CUSTOM_FORMULA",
                            values: [{ userEnteredValue: `=AND(I6<>""; I6=MINIFS($I:$I; $E:$E; $E6))` }] // Use E:E for grouping
                        },
                        format: { backgroundColor: { red: 0.7, green: 0.9, blue: 0.7 } } // Green
                    }
                },
                index: 0
            }
        };

        await dashSheet.saveUpdatedCells();

        const sheetsService = google.sheets({ version: 'v4', auth });
        await sheetsService.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_ID,
            requestBody: { requests: [formatReq] }
        });

        console.log("\n[SUCCESS] Custom Block Dashboard V2 generated.");

    } catch (error) {
        console.error('\n[ERROR] Operation Failed!');
        console.error(error);
    }
}

main();
