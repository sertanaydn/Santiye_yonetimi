
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name) {
            return NextResponse.json({ success: false, error: 'Proje adı zorunludur' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('projects')
            .insert([
                {
                    name: body.name,
                    type: body.type,
                    status: body.status || 'ongoing',
                    start_date: body.start_date || null,
                    end_date: body.end_date || null,
                    independent_section_count: body.independent_section_count ? parseInt(body.independent_section_count) : 0,
                    construction_area_m2: body.construction_area_m2 ? parseFloat(body.construction_area_m2) : 0,
                    tracking_type: body.tracking_type || 'general',
                    settings: body.settings || {},
                    country: body.country,
                    city: body.city
                }
            ])
            .select();

        if (error) {
            console.error('Supabase Error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error) {
        console.error('Server Error:', error);
        return NextResponse.json({ success: false, error: 'Sunucu hatası oluştu' }, { status: 500 });
    }
}
