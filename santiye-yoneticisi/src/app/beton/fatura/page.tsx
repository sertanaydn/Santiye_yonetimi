'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Eye, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ConcreteInvoiceListPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data, error } = await supabase
                .from('concrete_invoices')
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
                .from('concrete_invoices')
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
        (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Beton Faturaları" subtitle="Tüm beton faturalarını görüntüleyin">
                <Link href="/beton/fatura/yeni">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Fatura
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                <div className="flex gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Fatura No Ara..."
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
                                <TableHead className="text-right">TOPLAM TUTAR</TableHead>
                                <TableHead className="text-right">CAMSAN PAYI</TableHead>
                                <TableHead className="text-right">KOPARAN PAYI</TableHead>
                                <TableHead className="text-center">ÇEK VADESİ</TableHead>
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
                                    <TableCell className="text-right font-mono font-bold">
                                        {Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {Number(invoice.camsan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {Number(invoice.koparan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                    </TableCell>
                                    <TableCell className="text-center text-red-600 font-medium">
                                        {new Date(invoice.check_due_date).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell className="text-right p-2">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/beton/fatura/${invoice.id}`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-500 hover:text-blue-600">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
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
        </div>
    );
}
