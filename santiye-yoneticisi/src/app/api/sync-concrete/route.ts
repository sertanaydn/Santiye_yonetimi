
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { appendToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, supplier, concrete_class, casting_type, location_block, location_floor, quantity, slump } = body;

        // 1. Save to Supabase
        const { data, error } = await supabase
            .from('concrete_logs')
            .insert([
                {
                    date,
                    supplier,
                    concrete_class,
                    casting_type,
                    location_block,
                    location_floor,
                    quantity,
                    slump,
                    status: 'Döküldü'
                }
            ])
            .select()
            .single();

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // 2. Sync to Google Sheets (We might want a separate sheet for Concrete called 'BETON TAKİP')
        try {
            await appendToSheet('BETON TAKİP', {
                'TARİH': date,
                'TEDARİKÇİ': supplier,
                'BETON SINIFI': concrete_class,
                'DÖKÜM TİPİ': casting_type,
                'BLOK': location_block,
                'KAT/BÖLGE': location_floor,
                'MİKTAR (m3)': quantity,
                'SLUMP': slump,
                'DURUM': 'Döküldü'
            });
        } catch (sheetError) {
            console.error('Sheet Sync Failed:', sheetError);
        }

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
