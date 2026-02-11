
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { appendRowsToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, supplier, company, waybill_no, photo_url, created_by, items } = body;

        // Normalize input: Support both single item (legacy) and items array
        let processedItems: any[] = [];

        if (items && Array.isArray(items)) {
            processedItems = items;
        } else {
            // Legacy single item support
            const { location, material_id, material_name, quantity, unit, notes } = body;
            if (material_id && quantity) {
                processedItems.push({ location, material_id, material_name, quantity, unit, notes });
            }
        }

        // Validation
        if (!date || !supplier || processedItems.length === 0) {
            return NextResponse.json({ error: 'Eksik bilgi: Tarih, Tedarikçi veya Kalemler girilmedi.' }, { status: 400 });
        }

        const waybillsToInsert = processedItems.map(item => ({
            date,
            supplier,
            company,
            waybill_no,
            location: item.location,
            material_id: item.material_id,
            quantity: parseFloat(item.quantity),
            unit: item.unit,
            notes: item.notes,
            photo_url,
            created_by,
            sync_status: false
        }));

        // 1. Save to Supabase (Waybills) - Batch Insert
        const { data: insertedWaybills, error: waybillError } = await supabase
            .from('waybills')
            .insert(waybillsToInsert)
            .select();

        if (waybillError) {
            console.error('Supabase Waybill Error:', waybillError);
            if (waybillError.message && waybillError.message.includes("column") && waybillError.message.includes("does not exist")) {
                return NextResponse.json({ error: "VERİTABANI GÜNCELLEMESİ GEREKİYOR: Yeni alanlar (irsaliye no, birim, notlar) veritabanında yok. Lütfen yönetici ile iletişime geçin veya SQL güncellemesini yapın." }, { status: 500 });
            }
            return NextResponse.json({ error: "Kayıt Hatası: " + waybillError.message }, { status: 500 });
        }

        // 2. Prepare Stock Transactions & Sheet Rows
        const transactionsToInsert: any[] = [];
        const sheetRows: any[] = [];

        // Check current stock for all materials involved
        // Optimization: Fetch all materials involved to update stock
        // For simplicity, we loop. Batch update for stock is complex in Supabase without a stored proc.
        // We will loop for stock updates but batch insert transactions.

        for (let i = 0; i < insertedWaybills.length; i++) {
            const wb = insertedWaybills[i];
            const item = processedItems[i]; // Corresponding item
            const qty = parseFloat(item.quantity);

            // Transaction
            transactionsToInsert.push({
                material_id: wb.material_id,
                transaction_type: 'IN',
                quantity: qty,
                waybill_id: wb.id,
                supplier: supplier,
                created_by: created_by,
                notes: `Giriş: ${company || ''} - ${item.location || ''} (No: ${waybill_no || '-'}) - ${item.notes || ''}`
            });

            // Sheet Row
            sheetRows.push({
                'TARİH': date,
                'FİRMA': company || 'Merkez',
                'TEDARİKÇİ': supplier,
                'MALZEME': item.material_name,
                'BİRİM': item.unit || 'Adet',
                'MİKTAR': qty,
                'BİRİM FİYAT': 0,
                'TOPLAM TUTAR': 0,
                'İRSALİYE NO': waybill_no || '',
                'AÇIKLAMA': item.notes || '',
                'FOTOĞRAF': photo_url || '',
                'KAYDEDEN': created_by || 'Sistem'
            });

            // Update Stock (One by one for now to ensure consistency)
            const { data: matData } = await supabase
                .from('materials')
                .select('current_stock')
                .eq('id', wb.material_id)
                .single();

            if (matData) {
                const newStock = (Number(matData.current_stock) || 0) + qty;
                await supabase.from('materials').update({ current_stock: newStock }).eq('id', wb.material_id);
            }
        }

        // Batch Insert Transactions
        if (transactionsToInsert.length > 0) {
            const { error: transError } = await supabase
                .from('material_transactions')
                .insert(transactionsToInsert);
            if (transError) console.error('Stock Transaction Error:', transError);
        }

        // 3. Sync to Google Sheets (Bulk)
        let sheetSynced = false;
        try {
            await appendRowsToSheet('VERİ GİRİŞİ', sheetRows);
            sheetSynced = true;

            // Update sync status for all inserted waybills
            const ids = insertedWaybills.map(w => w.id);
            await supabase.from('waybills').update({ sync_status: true }).in('id', ids);

        } catch (sheetError) {
            console.error('Sheet Sync Failed:', sheetError);
        }

        return NextResponse.json({ success: true, count: insertedWaybills.length, sheetSynced });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
