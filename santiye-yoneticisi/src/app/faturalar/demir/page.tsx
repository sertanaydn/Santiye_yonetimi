'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, ArrowLeft, Eye, FileText, CheckCircle2, ArrowRightLeft } from 'lucide-react';

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function IronInvoiceListPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('iron_invoices')
                .select('*')
                .order('invoice_date', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Faturalar yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, invoiceNumber: string) => {
        if (!confirm(`${invoiceNumber} numaralı faturayı silmek istediğinizden emin misiniz?`)) return;

        try {
            // Unlink waybills
            await supabase
                .from('waybills')
                .update({ invoice_id: null, invoice_type: null, sync_status: false })
                .eq('invoice_id', id);

            // Unlink machine logs
            await supabase
                .from('site_transactions')
                .update({ invoice_id: null, invoice_type: null })
                .eq('invoice_id', id);

            const { error } = await supabase
                .from('iron_invoices')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Fatura silindi');
            fetchInvoices();
        } catch (error: any) {
            console.error(error);
            toast.error('Silme hatası: ' + error.message);
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.supplier || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Detail Dialog State
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [itemsError, setItemsError] = useState(false);
    const [linkedWaybills, setLinkedWaybills] = useState<any[]>([]);
    const [linkedMachineLogs, setLinkedMachineLogs] = useState<any[]>([]);
    const [processingTransfer, setProcessingTransfer] = useState(false);

    const handleTransferToAccount = async () => {
        if (!selectedInvoice) return;
        const isReprocess = selectedInvoice.account_processed;
        const confirmMessage = isReprocess
            ? 'Bu fatura zaten işlenmiş. Mevcut cari kayıtlarını silip TEKRAR aktarmak istiyor musunuz?'
            : 'Bu faturayı Cari Yönetim listesine aktarmak istiyor musunuz?';

        if (!confirm(confirmMessage)) return;

        setProcessingTransfer(true);
        try {
            // Eğer tekrar işleniyorsa, önceki kayıtları temizle (fatura ID'sine göre)
            // Not: site_transactions tablosunda invoice_id veya referans tutuluyorsa silebiliriz.
            // Şimdilik sadece yeni ekleme yapacağız veya transaction_id tutuyorsak güncelleyeceğiz.
            // RPC olmadığı için manuel ekleme yapıyoruz.

            // 1. Fatura Kalemlerini Çek
            const { data: items, error: itemsError } = await supabase
                .from('iron_invoice_items')
                .select('*')
                .eq('invoice_id', selectedInvoice.id);

            if (itemsError) throw itemsError;

            if (!items || items.length === 0) {
                toast.error("Aktarılacak kalem bulunamadı.");
                return;
            }

            // 2. Faturayı Tek Kalem Olarak Ekle (User Request: Tek satır ve toplam tutar)
            // Description olarak kullanıcının girdiği notu (veya varsayılan formatı) kullan.

            const transactionDescription = selectedInvoice.notes || `Fatura No: ${selectedInvoice.invoice_number} - Demir Alımı`;

            const transactionToAdd = {
                status: 'ONAYLANDI', // Faturadan geldiği için onaylı
                transaction_date: selectedInvoice.invoice_date,
                firm_name: 'Camsan&Koparan', // User request: Tek satır. Varsayılan Ortak.
                supplier_name: selectedInvoice.supplier,
                document_no: selectedInvoice.invoice_number,
                district: 'Şantiye', // Genel
                work_type: 'Malzeme Faturası', // Malzeme Faturası
                description: transactionDescription, // Kullanıcının girdiği not
                category: 'İnşaat Demiri', // Kategori
                detail: '', // Detay boş olabilir
                quantity: 1,
                unit: 'Adet',
                unit_price: selectedInvoice.grand_total,
                amount: selectedInvoice.grand_total, // KDV dahil mi hariç mi? Genelde Cari'ye toplam borç işlenir.
                vat_amount: 0, // Toplam tutar üzerinden gidildiği için KDV ayrımı ayrıca yapılmıyor bu aşamada, veya grand_total içinde.
                total_amount: selectedInvoice.grand_total,
                company: 'Merkez', // Genel varsayılan
                // invoice_id: selectedInvoice.id
            };

            const { error: insertError } = await supabase
                .from('site_transactions')
                .insert([transactionToAdd]); // Tek satır insert

            if (insertError) throw insertError;

            // 3. Faturayı İşlendi Olarak İşaretle
            const { error: updateError } = await supabase
                .from('iron_invoices')
                .update({ account_processed: true })
                .eq('id', selectedInvoice.id);

            if (updateError) throw updateError;

            toast.success("Fatura başarıyla Cari Yönetim'e aktarıldı!");

            // Update local state
            setSelectedInvoice({ ...selectedInvoice, account_processed: true });
            setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? { ...inv, account_processed: true } : inv));

        } catch (error: any) {
            console.error('Transfer hatası:', error);
            toast.error('Aktarım başarısız: ' + error.message);
        } finally {
            setProcessingTransfer(false);
        }
    };

    const handleViewDetails = async (invoice: any) => {
        setSelectedInvoice(invoice);
        setDetailsOpen(true);
        setLoadingDetails(true);
        setItemsError(false);

        try {
            const { data, error } = await supabase
                .from('iron_invoice_items')
                .select('*')
                .eq('invoice_id', invoice.id);

            if (error) throw error;

            const items = data || [];
            setInvoiceItems(items);

            // Fetch linked source records
            const { data: waybills } = await supabase
                .from('waybills') // waybills
                .select('*, materials(name)')
                .eq('invoice_id', invoice.id);
            setLinkedWaybills(waybills || []);

            const { data: logs } = await supabase
                .from('site_transactions') // machine logs
                .select('*')
                .eq('invoice_id', invoice.id);
            setLinkedMachineLogs(logs || []);


            // Calculate shares on the fly if they are not saved in the invoice
            if (!invoice.camsan_share && !invoice.koparan_share) {
                let camsanTotal = 0;
                let koparanTotal = 0;

                items.forEach((item: any) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
                    const allocation = item.allocation || 'Ortak';

                    if (allocation === 'Camsan') {
                        camsanTotal += lineTotal;
                    } else if (allocation === 'Koparan') {
                        koparanTotal += lineTotal;
                    } else { // Ortak or NULL
                        camsanTotal += lineTotal * 0.60;
                        koparanTotal += lineTotal * 0.40;
                    }
                });

                const grandTotal = Number(invoice.grand_total || 0);
                const totalBase = camsanTotal + koparanTotal;

                if (totalBase > 0) {
                    const calculatedCamsanShare = (camsanTotal / totalBase) * grandTotal;
                    const calculatedKoparanShare = (koparanTotal / totalBase) * grandTotal;

                    setSelectedInvoice((prev: any) => ({
                        ...prev,
                        camsan_share: calculatedCamsanShare,
                        koparan_share: calculatedKoparanShare
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            setItemsError(true);
            toast.error('Detaylar yüklenemedi');
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Öztop" subtitle="İnşaat demiri alımları ve takibi">
                <div className="flex gap-2">
                    <Link href="/faturalar">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri Dön
                        </Button>
                    </Link>
                    <Link href="/faturalar/demir/yeni">
                        <Button className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Fatura
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                <div className="flex gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Fatura No veya Tedarikçi Ara..."
                            className="pl-9 bg-neutral-50 border-neutral-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <Card className="flex-1 overflow-auto border-neutral-200 shadow-sm rounded-lg">
                    <Table>
                        <TableHeader className="bg-neutral-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>FATURA NO</TableHead>
                                <TableHead>TARİH</TableHead>
                                <TableHead>TEDARİKÇİ</TableHead>
                                <TableHead className="text-right">TOPLAM TUTAR</TableHead>
                                <TableHead className="text-right">CAMSAN PAYI</TableHead>
                                <TableHead className="text-right">KOPARAN PAYI</TableHead>
                                <TableHead className="text-center">NOTLAR</TableHead>
                                <TableHead className="text-right">İŞLEMLER</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        Henüz fatura bulunmuyor.
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-neutral-50">
                                    <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell>{invoice.supplier}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-blue-600">
                                        {invoice.camsan_share ? Number(invoice.camsan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TRY' : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm text-green-600">
                                        {invoice.koparan_share ? Number(invoice.koparan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TRY' : '-'}
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-neutral-500 max-w-[200px] truncate">
                                        {invoice.notes || '-'}
                                    </TableCell>
                                    <TableCell className="text-right p-2">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-neutral-500 hover:text-blue-600"
                                                onClick={() => handleViewDetails(invoice)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-neutral-500 hover:text-red-600"
                                                onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Detail Dialog */}
            {selectedInvoice && (
                <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="flex flex-row items-center justify-between">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Fatura Detayı: {selectedInvoice.invoice_number}
                            </DialogTitle>
                            <div className="flex gap-2">
                                {selectedInvoice.account_processed && (
                                    <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-medium border border-green-200">
                                        <CheckCircle2 className="w-4 h-4" />
                                        İşlendi
                                    </div>
                                )}
                                <Button
                                    onClick={handleTransferToAccount}
                                    disabled={processingTransfer}
                                    variant={selectedInvoice.account_processed ? "secondary" : "default"}
                                    className={`gap-2 ${!selectedInvoice.account_processed ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                >
                                    <ArrowRightLeft className="w-4 h-4" />
                                    {processingTransfer ? 'İşleniyor...' : (selectedInvoice.account_processed ? 'Tekrar Aktar' : 'Cari Yönetime Aktar')}
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                            <div>
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Tedarikçi</div>
                                <div className="font-semibold text-neutral-800">{selectedInvoice.supplier}</div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Fatura Tarihi</div>
                                <div className="font-mono text-neutral-800">{new Date(selectedInvoice.invoice_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div className="col-span-3 mt-4 pt-4 border-t border-neutral-200 grid grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs text-neutral-500 font-medium uppercase">Ara Toplam</div>
                                    <div className="font-mono font-semibold text-neutral-800">
                                        {Number(selectedInvoice.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-neutral-500 font-medium uppercase">KDV (%20)</div>
                                    <div className="font-mono font-semibold text-neutral-800">
                                        {Number(selectedInvoice.tax_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-neutral-500 font-medium uppercase">Fatura Toplamı</div>
                                    <div className="font-mono font-bold text-lg text-orange-600">
                                        {Number(selectedInvoice.grand_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </div>
                                </div>
                                {selectedInvoice.tevkifat_amount > 0 && (
                                    <div className="col-span-3 bg-red-50/50 p-3 rounded border border-red-100/50 flex justify-between items-center mt-2">
                                        <div className="flex gap-6">
                                            <div>
                                                <span className="text-xs text-neutral-500 mr-2 uppercase font-medium">Uygulanan Tevkifat (5/10):</span>
                                                <span className="font-mono font-bold text-red-600">-{Number(selectedInvoice.tevkifat_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY</span>
                                            </div>
                                            <div>
                                                <span className="text-xs text-neutral-500 mr-2 uppercase font-medium">Ödenecek KDV:</span>
                                                <span className="font-mono font-bold text-neutral-800">{Number(selectedInvoice.tax_amount - selectedInvoice.tevkifat_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cost Allocation Shares */}
                            <div className="col-span-3 bg-neutral-100/50 p-4 rounded-lg border border-neutral-200 flex justify-around items-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Camsan Payı</span>
                                    <span className="font-mono font-bold text-neutral-800 text-lg">
                                        {Number(selectedInvoice.camsan_share || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-neutral-300 mx-4"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider mb-1">Koparan Payı</span>
                                    <span className="font-mono font-bold text-neutral-800 text-lg">
                                        {Number(selectedInvoice.koparan_share || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TRY
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold mb-3 text-neutral-700">Fatura Kalemleri</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-50">
                                        <TableRow>
                                            <TableHead>Mahal / Blok</TableHead>
                                            <TableHead>Malzeme</TableHead>
                                            <TableHead>Kime Ait?</TableHead>
                                            <TableHead className="text-right">Miktar</TableHead>
                                            <TableHead className="text-right">Birim Fiyat</TableHead>
                                            <TableHead className="text-right">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingDetails ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">Yükleniyor...</TableCell>
                                            </TableRow>
                                        ) : invoiceItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Kalem bulunamadı.</TableCell>
                                            </TableRow>
                                        ) : (
                                            invoiceItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.mahal || '-'}</TableCell>
                                                    <TableCell className="font-medium">{item.description}</TableCell>
                                                    <TableCell>{item.allocation || '-'}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {Number(item.quantity).toLocaleString('tr-TR')} {item.unit || 'Ton'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {Number(item.quantity * item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {selectedInvoice.notes && (
                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                                <span className="font-semibold mr-2">Not:</span> {selectedInvoice.notes}
                            </div>
                        )}

                        {/* Linked Source Records */}
                        {(linkedWaybills.length > 0 || linkedMachineLogs.length > 0) && (
                            <div className="mt-8 pt-6 border-t border-neutral-200">
                                <h3 className="text-sm font-semibold mb-3 text-neutral-700 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Bağlı Kayıtlar (İrsaliye & Çalışma Detayları)
                                </h3>
                                <div className="border rounded-lg overflow-hidden bg-neutral-50/50">
                                    <Table>
                                        <TableHeader className="bg-neutral-100/50">
                                            <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>Tip</TableHead>
                                                <TableHead>Açıklama / No</TableHead>
                                                <TableHead>Mahal</TableHead>
                                                <TableHead>Pay (Allocation)</TableHead>
                                                <TableHead className="text-right">Miktar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {linkedWaybills.map(wb => (
                                                <TableRow key={`wb-${wb.id}`} className="text-sm">
                                                    <TableCell>{new Date(wb.date).toLocaleDateString('tr-TR')}</TableCell>
                                                    <TableCell><span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">İrsaliye</span></TableCell>
                                                    <TableCell>{wb.waybill_no} - {wb.materials?.name || 'Demir'}</TableCell>
                                                    <TableCell>{wb.location || '-'}</TableCell>
                                                    <TableCell>{wb.allocation || 'Ortak'}</TableCell>
                                                    <TableCell className="text-right font-mono">{wb.quantity} {(wb.unit || 'Ton')}</TableCell>
                                                </TableRow>
                                            ))}
                                            {linkedMachineLogs.map(log => (
                                                <TableRow key={`log-${log.id}`} className="text-sm">
                                                    <TableCell>{new Date(log.transaction_date).toLocaleDateString('tr-TR')}</TableCell>
                                                    <TableCell><span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Çalışma</span></TableCell>
                                                    <TableCell>{log.category} - {log.description}</TableCell>
                                                    <TableCell>{log.district || '-'}</TableCell>
                                                    <TableCell>{log.allocation || 'Ortak'}</TableCell>
                                                    <TableCell className="text-right font-mono">{log.quantity} {(log.unit || 'Saat')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
