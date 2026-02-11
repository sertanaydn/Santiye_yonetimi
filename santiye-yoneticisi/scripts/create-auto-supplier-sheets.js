
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

        // Use loadCells to avoid filtering logic here, we just want names
        await mainSheet.loadCells('A1:E1000'); // Load A to E

        const suppliers = new Set();
        // Col E is Index 4 (Tedarikçi)
        for (let r = 1; r < 1000; r++) {
            const cell = mainSheet.getCell(r, 4);
            if (cell.value) suppliers.add(String(cell.value).trim());
        }

        const supplierList = Array.from(suppliers);
        console.log("Suppliers to create sheets for:", supplierList);

        for (const supName of supplierList) {
            const sheetTitle = supName.toUpperCase(); // Clean title

            let sheet = doc.sheetsByTitle[sheetTitle];
            if (!sheet) {
                console.log(`Creating sheet: ${sheetTitle}`);
                sheet = await doc.addSheet({ title: sheetTitle });
            } else {
                console.log(`Sheet exists, clearing: ${sheetTitle}`);
                await sheet.clear();
            }

            // Write QUERY Formula in A1
            // Formula: =QUERY('VERİ GİRİŞİ'!A:P; "Select * Where D = 'SupplierName'"; 1)
            // AFTER INSERT: 
            // A=ONAY, B=TARİH, C=FİRMA, D=TEDARİKÇİ ?? 
            // Wait, Inspect of Row 1 in Step 2112:
            // Col Index 0: ONAY
            // Col Index 1: ONAY (Duplicate?) - Wait, duplicate header error earlier.
            // Col Index 2: TARİH
            // Col Index 3: FİRMA
            // Col Index 4: TEDARİKÇİ

            // So Tedarikçi is Col E (Index 4). In QUERY, cols are A,B,C,D,E...
            // So E is Col5.

            // Formula: =QUERY('VERİ GİRİŞİ'!A:P; "Select * Where E = 'SupplierName'"; 1)

            const query = `=QUERY('VERİ GİRİŞİ'!A:P; "SELECT * WHERE E = '${supName}'"; 1)`;

            await sheet.loadCells('A1');
            sheet.getCell(0, 0).formula = query;
            await sheet.saveUpdatedCells();
        }

        console.log("\n[SUCCESS] Supplier sheets created/updated.");

    } catch (error) {
        console.error(error);
    }
}
main();
