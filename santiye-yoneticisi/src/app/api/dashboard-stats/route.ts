
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Waybill Count (Today)
        const { count: waybillCount, error: waybillError } = await supabase
            .from('waybills')
            .select('*', { count: 'exact', head: true })
            .eq('date', today);

        // 2. Pending Requests
        const { count: requestCount, error: requestError } = await supabase
            .from('purchase_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Bekliyor');

        // 3. Total Concrete (Ideally summation, but count for now or sum query via RPC if needed)
        // Supabase JS client doesn't support SUM directly easily without RPC, so we fetch records for today and sum in JS (okay for small scale).
        const { data: concreteData } = await supabase
            .from('concrete_logs')
            .select('quantity')
            .eq('date', today);

        const totalConcrete = concreteData?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0;

        return NextResponse.json({
            waybillCount: waybillCount || 0,
            requestCount: requestCount || 0,
            totalConcrete: totalConcrete
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
