'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, MapPin, User, Clock, CheckCircle2, Circle, Wallet } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function MachineOperationsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        // Fetch site_transactions filtered by machine categories
        const { data, error } = await supabase
            .from('site_transactions')
            .select(`
                *,
                machine_log:machine_logs (*)
            `)
            .in('category', ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine', 'Hizmet'])
            .order('transaction_date', { ascending: false });

        if (error) {
            console.error('Error fetching machine logs:', error);
            toast.error('Veriler yüklenirken hata oluştu');
        } else {
            // Normalize data structure
            const normalized = (data || []).map((t: any) => {
                const log = t.machine_log?.[0] || {};
                return {
                    id: t.id,
                    work_date: log.work_date || t.transaction_date,
                    machine_name: log.machine_name || t.category, // Fallback
                    operator_name: log.operator_name || '-',
                    location_detail: log.location_detail || t.district || t.project_id || '-',
                    hours_worked: log.hours_worked || t.quantity || 0,
                    start_time: log.start_time,
                    end_time: log.end_time,
                    notes: log.notes || t.description,
                    transaction: t
                };
            });
            setLogs(normalized);
        }
        setLoading(false);
    };

    const filteredLogs = logs.filter(log =>
        log.machine_name?.toLowerCase().includes(filterText.toLowerCase()) ||
        log.location_detail?.toLowerCase().includes(filterText.toLowerCase()) ||
        log.transaction?.firm_name?.toLowerCase().includes(filterText.toLowerCase()) ||
        log.transaction?.supplier_name?.toLowerCase().includes(filterText.toLowerCase())
    );

    const totalHours = filteredLogs.reduce((sum, log) => sum + (Number(log.hours_worked) || 0), 0);
    const totalAmount = filteredLogs.reduce((sum, log) => sum + (Number(log.transaction?.amount) || 0), 0);

    const fixMissingLogs = async () => {
        const toastId = toast.loading('Kayıtlar kontrol ediliyor...');
        try {
            // 1. Get candidate transactions
            const { data: transactions } = await supabase
                .from('site_transactions')
                .select('id, category, transaction_date, quantity, district, description')
                .in('category', ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine']);

            if (!transactions) throw new Error('İşlem listesi alınamadı');

            let fixedCount = 0;

            for (const t of transactions) {
                // 2. Check overlap
                const { data: existing } = await supabase
                    .from('machine_logs')
                    .select('id')
                    .eq('transaction_id', t.id)
                    .maybeSingle();

                if (!existing) {
                    // Create minimal log using Secure RPC
                    const rpcPayload = {
                        p_transaction_id: t.id,
                        p_machine_name: t.category,
                        p_operator_name: null,
                        p_work_date: t.transaction_date,
                        p_hours_worked: Number(t.quantity) || 0,
                        p_location_detail: t.district || 'Şantiye',
                        p_notes: t.description
                    };

                    const { error } = await supabase.rpc('upsert_machine_log', rpcPayload);

                    if (!error) fixedCount++;
                }
            }

            if (fixedCount > 0) {
                toast.success(`${fixedCount} eksik kayıt onarıldı!`, { id: toastId });
                fetchLogs(); // Refresh UI
            } else {
                toast.success('Tüm kayıtlar güncel.', { id: toastId });
            }

        } catch (error) {
            console.error(error);
            toast.error('Onarım sırasında hata oluştu', { id: toastId });
        }
    };

    const handleTogglePaymentStatus = async (id: string, currentStatus: string) => {
        const nextStatus = {
            'Ödenmedi': 'Ödendi',
            'Ödendi': 'Kısmi',
            'Kısmi': 'Ödenmedi'
        }[currentStatus] || 'Ödendi';

        // Optimistic UI Update
        setLogs(logs.map(log =>
            log.id === id ? { ...log, transaction: { ...log.transaction, payment_status: nextStatus } } : log
        ));

        const { error } = await supabase
            .from('site_transactions')
            .update({ payment_status: nextStatus })
            .eq('id', id);

        if (error) {
            console.error("Payment Status Error:", error);
            toast.error("Ödeme durumu güncellenemedi");
            // Revert
            setLogs(logs.map(log =>
                log.id === id ? { ...log, transaction: { ...log.transaction, payment_status: currentStatus } } : log
            ));
        } else {
            toast.success(`Ödeme Durumu: ${nextStatus}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Makine Çalışmaları" subtitle="SAHA OPERASYON TAKİBİ" />

            <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 flex items-center gap-4 border-l-4 border-l-orange-500">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500 font-medium">Toplam Çalışma</div>
                            <div className="text-2xl font-bold">{totalHours.toLocaleString('tr-TR')} Saat</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500 font-medium">Kayıtlı İşlem</div>
                            <div className="text-2xl font-bold">{filteredLogs.length} Adet</div>
                        </div>
                    </Card>
                    <Card className="p-4 flex items-center gap-4 border-l-4 border-l-green-500">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Wallet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <div className="text-sm text-neutral-500 font-medium">Toplam Tutar</div>
                            <div className="text-2xl font-bold">{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</div>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 bg-white p-2 rounded border shadow-sm w-full md:w-96">
                    <Search className="w-4 h-4 text-gray-400 ml-2" />
                    <Input
                        placeholder="Makine, Operatör, Firma veya Konum Ara..."
                        className="border-none h-8 focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>

                {/* Data Table */}
                <Card className="flex-1 overflow-auto border-neutral-200 shadow-sm rounded-sm bg-white">
                    <Table>
                        <TableHeader className="bg-neutral-100 sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="font-bold">TARİH</TableHead>
                                <TableHead className="font-bold">MAKİNE / PLAKA</TableHead>
                                <TableHead className="font-bold">KONUM</TableHead>
                                {/* Removed Start-End Column */}
                                <TableHead className="text-right font-bold bg-orange-50 text-orange-700 border-x border-orange-100">MİKTAR / SÜRE</TableHead>
                                <TableHead className="font-bold">FİRMA / TEDARİKÇİ</TableHead>
                                <TableHead className="font-bold">AÇIKLAMA</TableHead>
                                <TableHead className="text-right font-bold">TUTAR</TableHead>
                                <TableHead className="text-center font-bold">DURUM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center h-24 text-neutral-500">Kayıt bulunamadı.</TableCell>
                                </TableRow>
                            ) : filteredLogs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-neutral-50 h-10 border-b border-neutral-100">
                                    <TableCell className="font-mono text-xs text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-neutral-400" />
                                            {new Date(log.work_date).toLocaleDateString('tr-TR')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-sm text-neutral-800">{log.machine_name}</TableCell>
                                    <TableCell className="text-sm text-neutral-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-neutral-400" />
                                            {log.location_detail || '-'}
                                        </div>
                                    </TableCell>
                                    {/* Removed Start-End Cell */}
                                    <TableCell className="text-right font-mono font-bold text-orange-600 bg-orange-50/50 border-x border-orange-100/50">
                                        {Number(log.hours_worked).toLocaleString('tr-TR')} <span className="text-[10px] text-orange-400 font-normal ml-1">{log.transaction?.unit}</span>
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-600">
                                        <div className="font-bold text-neutral-700">{log.transaction?.firm_name}</div>
                                        <div className="text-neutral-500">{log.transaction?.supplier_name}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-neutral-500 max-w-[200px] truncate" title={log.notes || log.transaction?.description}>
                                        {log.notes || log.transaction?.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs text-neutral-600">
                                        {log.transaction?.amount ? Number(log.transaction.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL' : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant="outline"
                                            className={`cursor-pointer select-none text-[10px] px-2 w-[80px] justify-center ${log.transaction?.payment_status === 'Ödendi' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                                                log.transaction?.payment_status === 'Kısmi' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' :
                                                    'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleTogglePaymentStatus(log.transaction?.id || log.id, log.transaction?.payment_status || 'Ödenmedi');
                                            }}
                                        >
                                            {log.transaction?.payment_status || 'Ödenmedi'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}

function Truck({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="1 14 1 20 8 20 8 14" />
            <line x1="14" y1="14" x2="14" y2="20" />
            <line x1="8" y1="20" x2="14" y2="20" />
            <line x1="17" y1="14" x2="17" y2="20" />
            <line x1="20" y1="14" x2="20" y2="20" />
            <line x1="17" y1="20" x2="23" y2="20" />
            <path d="M1 14h23v-5h-2l-3-6H6l-3 6H1Z" />
        </svg>
    )
}
