'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function ConcreteInvoiceViewPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchInvoice(params.id as string);
        }
    }, [params.id]);

    const fetchInvoice = async (id: string) => {
        try {
            const { data: invoiceData, error: invoiceError } = await supabase
                .from('concrete_invoices')
                .select('*')
                .eq('id', id)
                .single();

            if (invoiceError) throw invoiceError;

            const { data: itemsData, error: itemsError } = await supabase
                .from('concrete_invoice_items')
                .select('*')
                .eq('invoice_id', id);

            if (itemsError) throw itemsError;

            setInvoice(invoiceData);
            setItems(itemsData || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Fatura yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!invoice) return <div className="p-8 text-center text-red-500">Fatura bulunamadı.</div>;

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page { size: auto; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    body * { visibility: hidden; }
                    #printable-area, #printable-area * { visibility: visible; }
                    #printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                    .no-print { display: none !important; }
                    .border { border: 1px solid #eee !important; box-shadow: none !important; }
                    .shadow-sm { box-shadow: none !important; }
                }
            `}</style>

            <div className="flex flex-col h-full bg-[#f8f9fa]">
                <div className="no-print">
                    <PageHeader title={`Fatura No: ${invoice.invoice_number}`} subtitle="Canbek Fatura Detayı">
                        <Button onClick={() => router.push('/faturalar/beton')} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Liste
                        </Button>
                        <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
                            <Printer className="w-4 h-4 mr-2" />
                            Yazdır
                        </Button>
                    </PageHeader>
                </div>

                <div id="printable-area" className="flex-1 p-8 overflow-auto bg-white">
                    {/* Print Header */}
                    <div className="mb-8 border-b pb-4 flex justify-between items-end">
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">LOFT 777</h1>
                            <span className="text-xs font-bold tracking-[0.2em] text-neutral-500 uppercase">MİMARLIK & İNŞAAT</span>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                            <p>Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                        </div>
                    </div>

                    <Card className="p-6 mb-6 bg-white border-neutral-200 shadow-sm">
                        <div className="grid grid-cols-3 gap-4 text-sm mb-6">
                            <div>
                                <span className="font-bold">Fatura No:</span>
                                <div className="text-lg font-mono">{invoice.invoice_number}</div>
                            </div>
                            <div>
                                <span className="font-bold">Tarih:</span>
                                <div className="text-lg">{new Date(invoice.invoice_date).toLocaleDateString('tr-TR')}</div>
                            </div>
                            {invoice.waybill_date && (
                                <div>
                                    <span className="font-bold">İrsaliye Tarihi:</span>
                                    <div className="text-lg">{new Date(invoice.waybill_date).toLocaleDateString('tr-TR')}</div>
                                </div>
                            )}
                        </div>

                        <Table>
                            <TableHeader className="bg-red-100">
                                <TableRow>
                                    <TableHead className="font-bold">Mahal</TableHead>
                                    <TableHead className="font-bold">Beton Cinsi</TableHead>
                                    <TableHead className="font-bold text-right">Miktar</TableHead>
                                    <TableHead className="font-bold text-center">Birim</TableHead>
                                    <TableHead className="font-bold text-right">Birim Fiyat</TableHead>
                                    <TableHead className="font-bold text-right">Tutar</TableHead>
                                    <TableHead className="font-bold text-right">KDV(%20)</TableHead>
                                    <TableHead className="font-bold text-center">Dağıtım</TableHead>
                                    <TableHead className="font-bold text-right">Toplam</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.mahal}</TableCell>
                                        <TableCell>{item.product_name}</TableCell>
                                        <TableCell className="text-right font-bold">{item.quantity} M3</TableCell>
                                        <TableCell className="text-center text-sm text-gray-500">M3</TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {Number(item.subtotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {Number(item.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.allocation === 'Ortak' ? 'bg-purple-100 text-purple-700' :
                                                item.allocation === 'Camsan' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                {item.allocation}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {Number(item.total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    <div className="grid grid-cols-2 gap-6">
                        <Card className="p-6 bg-white border-neutral-200 shadow-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold">Camsan Payı:</span>
                                    <span className="font-mono font-bold">{Number(invoice.camsan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold">Koparan Payı:</span>
                                    <span className="font-mono font-bold">{Number(invoice.koparan_share).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-green-50 border-green-200 shadow-sm">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm pt-2 border-t border-green-300">
                                    <span className="font-bold">Toplam Tutar:</span>
                                    <span className="font-mono font-bold text-lg">{Number(invoice.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                                </div>
                                {invoice.check_due_date && (
                                    <div className="flex justify-between text-sm pt-2 border-t border-green-300">
                                        <span className="font-bold">Çek Vadesi:</span>
                                        <span className="font-mono font-bold text-red-600">{new Date(invoice.check_due_date).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}
