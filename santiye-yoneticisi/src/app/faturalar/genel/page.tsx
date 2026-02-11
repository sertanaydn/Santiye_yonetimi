'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Search, Trash2, ArrowLeft, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function GeneralInvoiceListPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('general_invoices')
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
            const { error } = await supabase
                .from('general_invoices')
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
        (invoice.supplier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Detail Dialog State
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [itemsError, setItemsError] = useState(false);

    const handleViewDetails = async (invoice: any) => {
        setSelectedInvoice(invoice);
        setDetailsOpen(true);
        setLoadingDetails(true);
        setItemsError(false);

        try {
            const { data, error } = await supabase
                .from('general_invoice_items')
                .select('*')
                .eq('invoice_id', invoice.id);

            if (error) throw error;
            setInvoiceItems(data || []);
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
            <PageHeader title="Genel Faturalar" subtitle="Diğer şantiye harcamaları ve takibi">
                <div className="flex gap-2">
                    <Link href="/faturalar">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Geri Dön
                        </Button>
                    </Link>
                    <Link href="/faturalar/genel/yeni">
                        <Button className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Yeni Gider
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                <div className="flex gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Fatura No, Tedarikçi veya Kategori Ara..."
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
                                <TableHead>KATEGORİ</TableHead>
                                <TableHead>TEDARİKÇİ</TableHead>
                                <TableHead>AÇIKLAMA</TableHead>
                                <TableHead className="text-right">TOPLAM TUTAR</TableHead>
                                <TableHead className="text-right">İŞLEMLER</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : filteredInvoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Henüz fatura bulunmuyor.
                                    </TableCell>
                                </TableRow>
                            ) : filteredInvoices.map((invoice) => (
                                <TableRow key={invoice.id} className="hover:bg-neutral-50">
                                    <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                                    <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                                            {invoice.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{invoice.supplier}</TableCell>
                                    <TableCell className="text-sm text-neutral-500 max-w-[200px] truncate">{invoice.description}</TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
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
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="w-5 h-5 text-green-600" />
                                Gider Detayı: {selectedInvoice.invoice_number}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                            <div>
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Kategori</div>
                                <div className="font-semibold text-neutral-800">{selectedInvoice.category}</div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Tedarikçi</div>
                                <div className="font-semibold text-neutral-800">{selectedInvoice.supplier}</div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Fatura Tarihi</div>
                                <div className="font-mono text-neutral-800">{new Date(selectedInvoice.invoice_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div className="col-span-3 pt-2">
                                <div className="text-xs text-neutral-500 font-medium uppercase mb-1">Toplam Tutar</div>
                                <div className="font-mono font-bold text-lg text-green-600">
                                    {Number(selectedInvoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-semibold mb-3 text-neutral-700">Fatura Kalemleri</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-neutral-50">
                                        <TableRow>
                                            <TableHead>Açıklama</TableHead>
                                            <TableHead className="text-right">Miktar</TableHead>
                                            <TableHead className="text-right">Birim Fiyat</TableHead>
                                            <TableHead className="text-right">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingDetails ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">Yükleniyor...</TableCell>
                                            </TableRow>
                                        ) : invoiceItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Kalem bulunamadı.</TableCell>
                                            </TableRow>
                                        ) : (
                                            invoiceItems.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.description}</TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {Number(item.quantity).toLocaleString('tr-TR')} {item.unit}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">
                                                        {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-semibold">
                                                        {Number(item.quantity * item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {selectedInvoice.description && (
                            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100 text-neutral-600 text-sm">
                                <span className="font-semibold mr-2">Genel Açıklama:</span> {selectedInvoice.description}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
