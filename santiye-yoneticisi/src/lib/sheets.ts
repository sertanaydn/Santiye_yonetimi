
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Load credentials from environment
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

export const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, serviceAccountAuth);

export async function appendToSheet(sheetName: string, rowData: Record<string, any>) {
    try {
        await doc.loadInfo(); // loads document properties and worksheets

        let sheet = doc.sheetsByTitle[sheetName];

        // If sheet doesn't exist, try to create it or fall back to Sheet1 if it's the first time
        if (!sheet) {
            if (doc.sheetCount === 1 && doc.sheetsByIndex[0].title === 'Sheet1') {
                // Rename Sheet1 to the new name
                sheet = doc.sheetsByIndex[0];
                await sheet.updateProperties({ title: sheetName });
            } else {
                // Create new sheet
                sheet = await doc.addSheet({ title: sheetName });
            }
        }

        // Check if headers need to be set
        const headers = Object.keys(rowData);
        await sheet.loadHeaderRow(); // try to load header row

        // If header row is empty or mismatches, we might want to set it (simplified logic here)
        // For now, valid assumption: if we are building the app, we set headers first time.
        // Sync header:
        if (sheet.rowCount === 0 || sheet.headerValues.length === 0) {
            await sheet.setHeaderRow(headers);
        }

        await sheet.addRow(rowData);
        return true;
    } catch (error) {
        console.error('Google Sheets Sync Error:', error);
        throw error;
    }
}

export async function appendRowsToSheet(sheetName: string, rowsData: Record<string, any>[]) {
    try {
        await doc.loadInfo();
        let sheet = doc.sheetsByTitle[sheetName];

        if (!sheet) {
            if (doc.sheetCount === 1 && doc.sheetsByIndex[0].title === 'Sheet1') {
                sheet = doc.sheetsByIndex[0];
                await sheet.updateProperties({ title: sheetName });
            } else {
                sheet = await doc.addSheet({ title: sheetName });
            }
        }

        if (rowsData.length > 0) {
            const headers = Object.keys(rowsData[0]);
            await sheet.loadHeaderRow();
            if (sheet.rowCount === 0 || sheet.headerValues.length === 0) {
                await sheet.setHeaderRow(headers);
            }
            await sheet.addRows(rowsData);
        }
        return true;
    } catch (error) {
        console.error('Google Sheets Bulk Sync Error:', error);
        throw error;
    }
}
