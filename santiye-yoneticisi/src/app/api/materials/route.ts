
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    try {
        if (id) {
            // Get single material
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return NextResponse.json(data);
        } else {
            // Get all materials
            const { data, error } = await supabase
                .from('materials')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            return NextResponse.json(data);
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.unit) {
            return NextResponse.json({ error: 'Name and Unit are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('materials')
            .insert([body])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
