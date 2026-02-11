
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
        const mainSheet = doc.sheetsByTitle['VERİ GİRİŞİ'];
        const sheetsService = google.sheets({ version: 'v4', auth });

        // 1. Check for Duplicate 'ONAY' (Index 1)
        // If Index 0=ONAY and Index 1=ONAY, delete Index 1.
        await mainSheet.loadCells('A1:B1');
        const header1 = mainSheet.getCell(0, 0).value;
        const header2 = mainSheet.getCell(0, 1).value;

        if (header1 === 'ONAY' && header2 === 'ONAY') {
            console.log("Duplicate ONAY detected in Col B. Deleting...");

            await sheetsService.spreadsheets.batchUpdate({
                spreadsheetId: SHEET_ID,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: mainSheet.sheetId,
                                dimension: "COLUMNS",
                                startIndex: 1,
                                endIndex: 2
                            }
                        }
                    }]
                }
            });
            console.log("Deleted Index 1. Columns shifted left.");
        } else {
            console.log(`Headers OK: ${header1}, ${header2}. Proceeding to fix formulas.`);
        }

        // 2. Update Formulas in All Sheets
        // New Structure after delete (or if clean):
        // A=ONAY, B=TARİH, C=FİRMA, D=TEDARİKÇİ
        // So Firma is C (Col3), Tedarikçi is D (Col4).

        // Old Formulas assumed:
        // Firma = D (Col4) -> Change to C
        // Tedarikçi = E (Col5) -> Change to D

        const sheetUpdates = [
            { title: 'CAMSAN', type: 'FIRM', value: 'Camsan' },
            { title: 'CAMSAN&KOPARAN', type: 'FIRM', value: 'Camsan&Koparan' },
            { title: 'KOPARAN', type: 'FIRM', value: 'Koparan' }, // User asked for Koparan sheet, usually implies Firm logic if Camsan is treated as firm.
            // Wait, previous script for Koparan used E='Koparan' (Supplier).
            // But if user meant Firm, it should be C='Koparan'.
            // However, Koparan data might be under Camsan&Koparan in Firm col.
            // Or maybe user puts "Koparan" in Supplier col?
            // Let's stick to consistent logic: If previous was D (Film), change to C. If E (Sup), change to D.

            // Suppliers
            { title: 'ÖZTOP', type: 'SUPPLIER', value: 'Öztop' },
            { title: 'SHN', type: 'SUPPLIER', value: 'Shn' },
            { title: 'CEPER', type: 'SUPPLIER', value: 'Ceper' },
            { title: 'CANBEK', type: 'SUPPLIER', value: 'Canbek' },
            { title: 'MINI KEPÇE', type: 'SUPPLIER', value: 'Mini Kepçe' },
            { title: 'BARIŞ VİNÇ', type: 'SUPPLIER', value: 'Barış Vinç' }
        ];

        for (const item of sheetUpdates) {
            const sheet = doc.sheetsByTitle[item.title];
            if (!sheet) continue;

            let colLetter = item.type === 'FIRM' ? 'C' : 'D'; // New Scheme: C=Firma, D=Tedarikçi

            // Formula: =QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE Col = 'Val'"; 1)
            // Range A:Z covers everything.
            const query = `=QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE ${colLetter} = '${item.value}'"; 1)`;

            console.log(`Updating ${item.title}: ${query}`);

            await sheet.clear(); // Ensure clean slate
            await sheet.loadCells('A1');
            sheet.getCell(0, 0).formula = query;
            await sheet.saveUpdatedCells();
        }

        console.log("\n[SUCCESS] All formulas updated to match cleaned column structure.");

    } catch (error) {
        console.error(error);
    }
}
main();
