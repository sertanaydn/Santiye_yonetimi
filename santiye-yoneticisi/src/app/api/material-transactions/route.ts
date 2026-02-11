
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const material_id = searchParams.get('material_id');

    try {
        let query = supabase
            .from('material_transactions')
            .select(`
                *,
                waybills (
                    date,
                    supplier,
                    photo_url
                ),
                projects (
                    name
                )
            `)
            .order('created_at', { ascending: false });

        if (material_id) {
            query = query.eq('material_id', material_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
