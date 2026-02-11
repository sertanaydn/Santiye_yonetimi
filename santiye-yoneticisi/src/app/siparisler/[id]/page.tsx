'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { useParams } from 'next/navigation';
import { Printer, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

export default function PurchaseOrderPage() {
    const params = useParams();
    const router = useRouter(); // Initialize router
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [printing, setPrinting] = useState(false);

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Siparis_Formu_${order?.order_number || 'Draft'}`,
        onBeforeGetContent: () => setPrinting(true),
        onAfterPrint: () => setPrinting(false),
    } as any);

    useEffect(() => {
        if (params.id) {
            fetchOrder(params.id as string);
        }
    }, [params.id]);

    const fetchOrder = async (id: string) => {
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('purchase_orders')
                .select('*')
                .eq('id', id)
                .single();

            if (orderError) throw orderError;

            const { data: itemData, error: itemError } = await supabase
                .from('purchase_order_items')
                .select('*')
                .eq('purchase_order_id', id);

            if (itemError) throw itemError;

            setOrder(orderData);
            setItems(itemData || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Sipariş yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Sipariş bulunamadı.</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] p-4 gap-4">
            {/* Header & Controls - Hidden on Print */}
            <div className="print:hidden flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Sipariş Formu</h1>
                        <p className="text-sm text-neutral-500">Resmi satınalma sipariş formu.</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                            <Printer className="w-4 h-4 mr-2" />
                            Yazdır / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* THE FORM (Print Target) */}
            <div className="overflow-auto flex-1 bg-gray-100 p-4 print:p-0 print:bg-white" style={{ minHeight: '800px' }}>
                <div ref={componentRef} className="bg-white p-8 shadow-md mx-auto print:shadow-none print:w-full max-w-[210mm] min-h-[297mm] relative flex flex-col items-center">

                    {/* Header */}
                    <div className="w-full flex justify-between items-center border-b-2 border-neutral-800 pb-4 mb-8">
                        {/* Logo / Company Name */}
                        <div className="text-3xl font-bold tracking-tighter">LOFT 777</div>

                        {/* Title */}
                        <div className="text-right">
                            <h2 className="text-xl font-bold mb-1">SATINALMA SİPARİŞİ</h2>
                            <div className="text-sm font-mono text-gray-500">PO-{new Date(order.order_date).getFullYear()}-{order.id.slice(0, 4).toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="w-full grid grid-cols-2 gap-8 mb-8">
                        {/* Supplier Info */}
                        <div className="border border-gray-200 p-4 rounded-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">TEDARİKÇİ / FİRMA</h3>
                            <div className="font-bold text-lg">{order.supplier_name}</div>
                            <div className="text-sm mt-1">{order.supplier_contact}</div>
                            <div className="text-sm">{order.supplier_phone}</div>
                            <div className="text-sm mt-2 text-gray-500">{order.supplier_address}</div>
                        </div>

                        {/* Order Details */}
                        <div className="border border-gray-200 p-4 rounded-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">SİPARİŞ DETAYLARI</h3>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Sipariş Tarihi:</span>
                                <span className="font-bold">{new Date(order.order_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Teslimat Tarihi:</span>
                                <span className="font-bold">{order.delivery_date || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Ödeme Vadesi:</span>
                                <span className="font-bold">{order.payment_terms || '-'}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-sm text-gray-600">Teslimat Şekli:</span>
                                <span className="font-bold">{order.delivery_terms || 'Şantiyeye Teslim'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-black text-xs uppercase font-bold text-left">
                                <th className="py-2 px-2">Ürün / Hizmet</th>
                                <th className="py-2 px-2">Açıklama</th>
                                <th className="py-2 px-2 text-right">Miktar</th>
                                <th className="py-2 px-2 text-center">Birim</th>
                                <th className="py-2 px-2 text-right">Birim Fiyat</th>
                                <th className="py-2 px-2 text-right">Toplam</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item.id} className="border-b border-gray-100 text-sm">
                                    <td className="py-3 px-2 font-medium">{item.product_name}</td>
                                    <td className="py-3 px-2 text-gray-500">{item.detail}</td>
                                    <td className="py-3 px-2 text-right font-bold">{Number(item.quantity).toLocaleString('tr-TR')}</td>
                                    <td className="py-3 px-2 text-center text-xs text-gray-400 uppercase">{item.unit}</td>
                                    <td className="py-3 px-2 text-right font-mono">
                                        {Number(item.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </td>
                                    <td className="py-3 px-2 text-right font-mono font-bold">
                                        {Number(item.total_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="w-full flex justify-end mb-12">
                        <div className="w-1/3 min-w-[200px]">
                            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                                <span className="font-medium text-gray-600">Ara Toplam</span>
                                <span className="font-mono">{Number(order.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-200 text-sm">
                                <span className="font-medium text-gray-600">KDV Tutarı</span>
                                <span className="font-mono">{Number(order.tax_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold mt-2">
                                <span>GENEL TOPLAM</span>
                                <span className="text-black">{Number(order.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="w-full mb-12 bg-gray-50 p-4 rounded text-sm text-gray-600 border-l-4 border-gray-300">
                            <h4 className="font-bold text-gray-800 mb-1 text-xs uppercase">Notlar:</h4>
                            <pre className="whitespace-pre-wrap font-sans">{order.notes}</pre>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="w-full mt-auto grid grid-cols-2 gap-20">
                        <div className="border-t border-black pt-4 text-center">
                            <div className="font-bold mb-1">LOFT 777</div>
                            <div className="text-xs text-gray-500 uppercase">Satınalma Yetkilisi / Onay</div>
                            <div className="h-20 mt-4"></div>
                        </div>
                        <div className="border-t border-black pt-4 text-center">
                            <div className="font-bold mb-1">{order.supplier_name.toUpperCase()}</div>
                            <div className="text-xs text-gray-500 uppercase">Tedarikçi Onayı / Kaşe İmza</div>
                            <div className="h-20 mt-4"></div>
                        </div>
                    </div>

                    <div className="w-full mt-8 text-[10px] text-gray-400 text-center">
                        Bu belge Loft 777 Şantiye Yönetim Sistemi tarafından {new Date().toLocaleString('tr-TR')} tarihinde oluşturulmuştur.
                    </div>

                </div>
            </div>
        </div>
    );
}
