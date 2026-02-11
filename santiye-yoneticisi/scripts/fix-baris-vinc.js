
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

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
    const auth = new JWT({
        email: envVars.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: envVars.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const SHEET_ID = '1tnwLxsjIx1rf5LoscRtrNx9wgYNiJmi6m2ZtDX9ZnIA';
    const doc = new GoogleSpreadsheet(SHEET_ID, auth);

    try {
        await doc.loadInfo();
        const titles = doc.sheetsByIndex.map(s => s.title);
        console.log("Titles:", JSON.stringify(titles));

        // Check manually for Baris Vinc
        const target = titles.find(t => t.includes('BARI'));
        if (target) {
            console.log(`Found target: "${target}"`);

            // Fix it here
            const sheet = doc.sheetsByTitle[target];
            if (sheet) {
                console.log(`Fixing ${target}...`);
                await sheet.clear();
                // Formula: WHERE E = 'Barış Vinç' or 'BARIŞ VİNÇ' ??
                // Data likely has 'Barış Vinç'.
                // E is Index 4 (Tedarikçi).
                const query = `=QUERY('VERİ GİRİŞİ'!A:Z; "SELECT * WHERE D = 'Barış Vinç'"; 1)`;
                // NOTE: Using D (Tedarikçi) as per my clean-up logic where I deleted Col B.

                await sheet.loadCells('A1');
                sheet.getCell(0, 0).formula = query;
                await sheet.saveUpdatedCells();
                console.log(`[SUCCESS] Fixed ${target} with D='Barış Vinç'`);
            }
        } else {
            console.log("Could not find Baris Vinc sheet.");
        }

    } catch (error) {
        console.error(error);
    }
}
main();
