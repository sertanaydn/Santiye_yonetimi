
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Eye, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/page-header";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner"; // Ensure toast is imported properly

export default function WaybillListPage() {
    const [waybills, setWaybills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWaybills();
    }, []);

    async function fetchWaybills() {
        // Fetch waybills with material names
        const { data, error } = await supabase
            .from('waybills')
            .select(`
                *,
                materials (name, unit)
            `)
            .order('date', { ascending: false });

        if (data) setWaybills(data);
        setLoading(false);
    }

    const handleTransferToAccount = async (waybill: any) => {
        if (!confirm(`${waybill.waybill_no || 'Bu'} irsaliyeyi Cari Yönetim'e aktarmak istiyor musunuz? (Tutar 0 TL olarak işlenecek)`)) return;

        try {
            // 1. Create entry in site_transactions
            const transactionRecord = {
                transaction_date: waybill.date,
                firm_name: waybill.company === 'Camsan&Koparan' ? 'Ortak' : (waybill.company || 'Ortak'),
                supplier_name: waybill.supplier,
                document_no: waybill.waybill_no,
                work_type: 'Malzeme İrsaliyesi',
                description: `İrsaliye No: ${waybill.waybill_no} - ${waybill.materials?.name || 'Malzeme'}`,
                category: 'İnşaat Demiri', // Assuming Iron for now based on context, or derive from material
                quantity: waybill.quantity,
                unit: waybill.unit || waybill.materials?.unit,
                unit_price: 0,
                amount: 0,
                total_amount: 0,
                vat_amount: 0,
                status: 'BEKLEYEN', // Or ONAYLANDI
                district: waybill.location || 'Şantiye',
                company: 'Merkez',
                detail: waybill.notes
            };

            const { error: insertError } = await supabase
                .from('site_transactions')
                .insert([transactionRecord]);

            if (insertError) throw insertError;

            // 2. Update waybill sync_status
            const { error: updateError } = await supabase
                .from('waybills')
                .update({ sync_status: true })
                .eq('id', waybill.id);

            if (updateError) throw updateError;

            toast.success("İrsaliye Cari Yönetim'e aktarıldı.");
            fetchWaybills(); // Refresh list

        } catch (error: any) {
            console.error('Transfer hatası:', error);
            toast.error('Aktarım başarısız: ' + error.message);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="İrsaliye Geçmişi">
                <div className="flex items-center gap-3">
                    <Link href="/irsaliye">
                        <Button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg p-0 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="flex-1 overflow-hidden p-6 gap-6">
                <div className="flex flex-col bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden h-full">

                    {/* Toolbar */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input placeholder="Tedarikçi veya Malzeme Ara..." className="pl-8 h-9 text-sm bg-neutral-50 border-neutral-200" />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b border-neutral-100">
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Tarih</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">İrsaliye No</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Firma</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Mahal / Blok</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Tedarikçi</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Malzeme</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Miktar</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Detay</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={9} className="text-center p-10 text-neutral-500">Yükleniyor...</TableCell></TableRow> :
                                    waybills.map((w) => (
                                        <TableRow key={w.id} className="hover:bg-neutral-50 border-b border-neutral-50">
                                            <TableCell className="py-3 font-mono text-sm text-neutral-600">
                                                {new Date(w.date).toLocaleDateString("tr-TR")}
                                            </TableCell>
                                            <TableCell className="py-3 font-mono text-sm text-neutral-600">{w.waybill_no || '-'}</TableCell>
                                            <TableCell className="font-medium py-3 text-neutral-700">{w.company || '-'}</TableCell>
                                            <TableCell className="py-3 text-neutral-600 text-sm">{w.location || '-'}</TableCell>
                                            <TableCell className="font-medium py-3 text-neutral-700">{w.supplier}</TableCell>
                                            <TableCell className="py-3 text-neutral-600 text-sm">
                                                {w.materials?.name || 'Bilinmeyen'}
                                            </TableCell>
                                            <TableCell className="py-3 text-neutral-700 font-semibold">
                                                {w.quantity} {w.unit || w.materials?.unit}
                                            </TableCell>
                                            <TableCell className="py-3 text-neutral-500 text-xs max-w-[200px] truncate" title={w.notes}>
                                                {w.notes || '-'}
                                            </TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {w.photo_url && (
                                                        <Dialog>
                                                            <DialogTrigger>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                                    <ImageIcon className="w-4 h-4" />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-none">
                                                                <img src={w.photo_url} alt="İrsaliye" className="w-full h-auto max-h-[80vh] object-contain" />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                    {w.sync_status ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-[10px]">Aktarıldı</Badge>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleTransferToAccount(w)}
                                                            className="h-7 text-xs border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                                        >
                                                            Cariye Aktar
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!loading && waybills.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center p-10 text-neutral-500">
                                            Henüz irsaliye girişi yapılmamış.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
