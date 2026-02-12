
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { appendToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { request_date, requester, item_name, quantity, unit, urgency } = body;

        // 1. Save to Supabase
        const { data, error } = await supabase
            .from('purchase_requests')
            .insert([
                {
                    request_date,
                    requester,
                    item_name,
                    quantity: Number(quantity), // Ensure number
                    unit: unit || 'Adet',
                    urgency,
                    location: body.location || '',
                    description: body.description || '',
                    status: 'Bekliyor'
                }
            ])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // 2. Sync to Google Sheets (SATIN ALMA TALEPLERİ sheet)
        try {
            await appendToSheet('SATIN ALMA TALEPLERİ', {
                'TARİH': request_date,
                'TALEP EDEN': requester,
                'MALZEME': item_name,
                'MİKTAR': `${quantity} ${unit}`, // Combine for sheet
                'ACİLİYET': urgency,
                'MAHAL': body.location || '',
                'AÇIKLAMA': body.description || '',
                'DURUM': 'Bekliyor'
            });
        } catch (sheetError) {
            console.error('Sheet Sync Failed:', sheetError);
        }

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
