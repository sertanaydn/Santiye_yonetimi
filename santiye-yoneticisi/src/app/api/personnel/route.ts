
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.name) {
            return NextResponse.json({ success: false, error: 'Ad Soyad zorunludur' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('personnel')
            .insert([
                {
                    name: body.name,
                    email: body.email,
                    phone: body.phone,
                    role: body.role,
                    company: body.company,
                    team: body.team,
                    tc_no: body.tc_no,
                    is_active: body.is_active !== undefined ? body.is_active : true,
                    is_company_official: body.is_company_official || false,
                    permissions: body.permissions || {},
                    // New Fields
                    birth_place: body.birth_place,
                    birth_date: body.birth_date ? body.birth_date : null,
                    gender: body.gender,
                    start_date: body.start_date ? body.start_date : null,
                    iban: body.iban,
                    sgk_no: body.sgk_no,
                    marital_status: body.marital_status,
                    child_count: body.child_count,
                    blood_type: body.blood_type,
                    mother_name: body.mother_name,
                    father_name: body.father_name,
                    registry_place: body.registry_place,
                    education_status: body.education_status,
                    military_status: body.military_status,
                    reference_person: body.reference_person,
                    approval_person: body.approval_person,
                    country: body.country,
                    city: body.city,
                    address: body.address
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
