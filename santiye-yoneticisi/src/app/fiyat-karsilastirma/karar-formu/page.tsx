'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Printer, ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';

export default function PurchaseDecisionFormPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [printDate, setPrintDate] = useState('');

    // Form State
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedDetail, setSelectedDetail] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

    // Data State
    const [products, setProducts] = useState<string[]>([]);
    const [details, setDetails] = useState<string[]>([]);
    const [comparisonData, setComparisonData] = useState<any[]>([]);

    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Satinalma_Karar_Formu_${selectedProduct}_${orderDate}`,
        onBeforeGetContent: () => setPrinting(true),
        onAfterPrint: () => setPrinting(false),
    } as any);

    useEffect(() => {
        setPrintDate(new Date().toLocaleString('tr-TR'));
    }, []);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            fetchDetails(selectedProduct);
        } else {
            setDetails([]);
            setSelectedDetail('');
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (selectedProduct) {
            generateComparison();
        }
    }, [selectedProduct, selectedDetail, quantity]);


    const fetchProducts = async () => {
        const { data } = await supabase.from('price_entries').select('product_name');
        if (data) {
            const unique = Array.from(new Set(data.map(d => d.product_name))).sort();
            setProducts(unique);
        }
    };

    const fetchDetails = async (product: string) => {
        const { data } = await supabase
            .from('price_entries')
            .select('detail')
            .eq('product_name', product);

        if (data) {
            const unique = Array.from(new Set(data.map(d => d.detail || '-'))).sort();
            setDetails(unique);
            if (unique.length === 1) setSelectedDetail(unique[0]);
        }
    };

    const generateComparison = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('price_entries')
                .select('*')
                .eq('product_name', selectedProduct)
                .order('date', { ascending: false }); // Get latest

            if (selectedDetail && selectedDetail !== '-') {
                query = query.eq('detail', selectedDetail);
            }

            const { data: priceEntries, error } = await query;

            if (error) throw error;

            // Group by firm, keep latest
            const latestByFirm: Record<string, any> = {};
            (priceEntries || []).forEach(entry => {
                if (!latestByFirm[entry.firm_name]) {
                    latestByFirm[entry.firm_name] = entry;
                }
            });

            // Fetch supplier details for these firms
            const firms = Object.keys(latestByFirm);
            const { data: suppliers } = await supabase
                .from('suppliers')
                .select('name, phone, contact_name')
                .in('name', firms);

            const supplierMap = (suppliers || []).reduce((acc: any, s: any) => {
                acc[s.name] = s;
                return acc;
            }, {});

            // Find global min price for this set
            const prices = Object.values(latestByFirm).map((e: any) => Number(e.price) || 0);
            const minPrice = Math.min(...prices);

            // Construct comparison data
            const comparison = Object.values(latestByFirm).map((entry: any, index) => {
                const supplier = supplierMap[entry.firm_name] || {};

                const unitPrice = Number(entry.price) || 0;
                const qty = Number(quantity) || 0;
                const total = unitPrice * qty;
                const vatRate = Number(entry.vat_rate) || 20;
                const vatAmount = total * (vatRate / 100);
                const grandTotal = total + vatAmount;

                return {
                    id: entry.id,
                    index: index + 1,
                    firm_name: entry.firm_name,
                    contact_phone: entry.contact_phone || supplier.phone || '-', // Prioritize entry
                    contact_name: entry.contact_name || supplier.contact_name || '-', // Prioritize entry
                    product_desc: `${entry.product_name} ${entry.detail || ''}`,
                    payment_terms: entry.payment_terms || entry.notes || '-',
                    delivery_date: entry.delivery_date || (entry.notes ? (entry.notes.length > 20 ? 'Notlara Bakın' : entry.notes) : 'Stoktan'),
                    shipping: entry.includes_shipping ? 'DAHİL' : 'HARİÇ',
                    unit_price: unitPrice,
                    quantity: qty,
                    unit: entry.unit || 'Adet',
                    total_amount: total,
                    vat_rate: vatRate,
                    vat_amount: vatAmount,
                    grand_total: grandTotal,
                    isMinPrice: unitPrice === minPrice && unitPrice > 0 // Flag for highlighting
                };
            });

            setComparisonData(comparison);

        } catch (error) {
            console.error(error);
            toast.error('Veriler oluşturulurken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrder = async (row: any) => {
        if (!confirm(`${row.firm_name} firmasına sipariş oluşturmak istiyor musunuz?`)) return;

        setLoading(true);
        console.log('Sipariş Süreci Başladı:', row);

        try {
            // 0. Check Auth (Non-blocking)
            let userId = null;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) userId = user.id;
            } catch (authError) {
                console.warn('Auth Helper Error (Ignored):', authError);
            }
            console.log('Kullanıcı ID (Opsiyonel):', userId);

            // 1. Get Supplier ID (Best Effort)
            const { data: supplierData, error: supplierError } = await supabase
                .from('suppliers')
                .select('id')
                .eq('name', row.firm_name)
                .single();

            if (supplierError) {
                console.warn('Tedarikçi bulunamadı veya hata:', supplierError);
            } else {
                console.log('Tedarikçi ID:', supplierData?.id);
            }

            // 2. Prepare Order Payload
            const orderPayload = {
                // created_by: userId, -- Let Postgres handle default auth.uid()
                supplier_id: supplierData?.id || null,
                supplier_name: row.firm_name,
                supplier_contact: row.contact_name,
                supplier_phone: row.contact_phone,
                order_date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                total_amount: row.total_amount,
                tax_amount: row.vat_amount,
                grand_total: row.grand_total,
                payment_terms: row.payment_terms,
                delivery_date: row.delivery_date,
                notes: `Talep Eden: Talep Eden\nTeslimat: ${row.shipping}`,
            };
            console.log('Sipariş Payload:', orderPayload);

            // 3. Create Order Header
            const { data: orderData, error: orderError } = await supabase
                .from('purchase_orders')
                .insert(orderPayload)
                .select()
                .single();

            if (orderError) {
                console.error('Purchase Order Insert Error:', orderError);
                throw orderError;
            }
            console.log('Sipariş Başlığı Oluştu:', orderData);

            // 4. Create Order Item
            const itemPayload = {
                purchase_order_id: orderData.id,
                product_name: selectedProduct,
                detail: selectedDetail === '-' ? '' : selectedDetail,
                quantity: row.quantity,
                unit: row.unit,
                unit_price: row.unit_price,
                vat_rate: row.vat_rate
            };
            console.log('Sipariş Kalem Payload:', itemPayload);

            const { error: itemError } = await supabase
                .from('purchase_order_items')
                .insert(itemPayload);

            if (itemError) {
                console.error('Purchase Order Item Insert Error:', itemError);
                throw itemError;
            }

            toast.success('Sipariş oluşturuldu!');
            // Redirect onto Order Page
            router.push(`/siparisler/${orderData.id}`);

        } catch (error: any) {
            console.error('GENEL HATA:', error);
            if (error && typeof error === 'object') {
                console.dir(error); // Logs strictly object props
            }
            toast.error('Sipariş oluşturulurken hata: ' + (error.message || error.details || 'Bilinmeyen Hata'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] p-4 gap-4">
            {/* Header & Controls - Hidden on Print */}
            <div className="print:hidden flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/fiyat-karsilastirma">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Satınalma Karar Formu Oluştur</h1>
                        <p className="text-sm text-neutral-500">Bu ekran üzerinden resmi teklif karşılaştırma formu oluşturabilirsiniz.</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedProduct('');
                                setSelectedDetail('');
                                setQuantity(1);
                            }}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" /> Sıfırla
                        </Button>
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                            <Printer className="w-4 h-4 mr-2" />
                            Formu Yazdır
                        </Button>
                    </div>
                </div>

                <Card className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-white border-neutral-200 shadow-sm">
                    <div className="space-y-1">
                        <Label>Sipariş Tarihi</Label>
                        <Input
                            type="date"
                            value={orderDate}
                            onChange={e => setOrderDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Ürün Seçimi</Label>
                        <SearchableSelect
                            options={products}
                            value={selectedProduct}
                            onChange={setSelectedProduct}
                            placeholder="Ürün Ara..."
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Detay / Özellik</Label>
                        <SearchableSelect
                            options={details}
                            value={selectedDetail}
                            onChange={setSelectedDetail}
                            placeholder={details.length > 0 ? "Detay Seç..." : "-"}
                            disabled={!selectedProduct}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label>Miktar</Label>
                        <Input
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value))}
                        />
                    </div>
                </Card>
            </div>

            {/* THE FORM PREVIEW (Print Target) */}
            <div className="overflow-auto flex-1 bg-gray-100 p-4 print:p-0 print:bg-white" style={{ minHeight: '800px' }}>
                <div ref={componentRef} className="bg-white p-8 shadow-md mx-auto print:shadow-none print:w-full max-w-[297mm] min-h-[210mm] relative flex flex-col">

                    {/* Form Header */}
                    <div className="flex border border-black mb-4">
                        {/* Company Logo Area */}
                        <div className="w-1/4 border-r border-black p-4 flex items-center justify-center font-bold text-xl">
                            LOFT 777
                        </div>
                        {/* Title */}
                        <div className="w-2/4 border-r border-black p-4 flex items-center justify-center font-bold text-lg md:text-xl text-center leading-tight">
                            FİYAT KARŞILAŞTIRMA / SATINALMA KARAR FORMU
                        </div>
                        {/* Date */}
                        <div className="w-1/4 p-2 flex flex-col justify-center items-center">
                            <div className="font-bold border-b border-black w-full text-center pb-1">SİPARİŞ TARİHİ</div>
                            <div className="pt-1 text-lg">{new Date(orderDate).toLocaleDateString('tr-TR')}</div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse border border-black text-[10px] md:text-xs">
                        <thead>
                            <tr className="bg-gray-100 print:bg-gray-100">
                                <th className="border border-black p-1">S.NO</th>
                                <th className="border border-black p-1">FİRMA</th>
                                <th className="border border-black p-1">İRTİBAT NUMARALARI</th>
                                <th className="border border-black p-1">FİRMA YETKİLİSİ</th>
                                <th className="border border-black p-1 w-[15%]">ÜRÜN AÇIKLAMASI</th>
                                <th className="border border-black p-1">ÖDEME</th>
                                <th className="border border-black p-1">TESLİM BİLGİSİ</th>
                                <th className="border border-black p-1">NAKLİYE</th>
                                <th className="border border-black p-1 text-right">BİRİM FİYAT</th>
                                <th className="border border-black p-1 text-right">MİKTAR</th>
                                <th className="border border-black p-1 text-center">BİRİM</th>
                                <th className="border border-black p-1 text-right bg-gray-200 print:bg-gray-200">TUTAR</th>
                                <th className="border border-black p-1 text-right">KDV</th>
                                <th className="border border-black p-1 text-right font-bold">YEKÜN</th>
                                <th className="border border-black p-1 text-center font-bold print:hidden">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonData.length === 0 ? (
                                <tr>
                                    <td colSpan={15} className="border border-black p-8 text-center text-gray-500 italic">
                                        Lütfen yukarıdan ürün seçimi yapınız.
                                    </td>
                                </tr>
                            ) : comparisonData.map((row) => (
                                <tr key={row.id} className={row.isMinPrice ? "bg-green-100 print:bg-green-100" : ""}>
                                    <td className="border border-black p-1 text-center font-bold">{row.index}</td>
                                    <td className="border border-black p-1 font-bold">{row.firm_name}</td>
                                    <td className="border border-black p-1">{row.contact_phone}</td>
                                    <td className="border border-black p-1">{row.contact_name}</td>
                                    <td className="border border-black p-1">{row.product_desc}</td>
                                    <td className="border border-black p-1">{row.payment_terms}</td>
                                    <td className="border border-black p-1">{row.delivery_date}</td>
                                    <td className="border border-black p-1 text-center">{row.shipping}</td>
                                    <td className="border border-black p-1 text-right font-mono">
                                        {row.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="border border-black p-1 text-right font-bold">
                                        {row.quantity.toLocaleString('tr-TR')}
                                    </td>
                                    <td className="border border-black p-1 text-center">{row.unit}</td>
                                    <td className="border border-black p-1 text-right font-mono font-bold bg-gray-50 print:bg-gray-50">
                                        {row.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </td>
                                    <td className="border border-black p-1 text-right text-[10px]">
                                        %{row.vat_rate} ({row.vat_amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL)
                                    </td>
                                    <td className="border border-black p-1 text-right font-mono font-bold">
                                        {row.grand_total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </td>
                                    {/* Action Column */}
                                    <td className="border border-black p-1 text-center print:hidden">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 text-[10px] px-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-none"
                                            onClick={() => handleCreateOrder(row)}
                                            disabled={loading}
                                        >
                                            Sipariş Ver
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {/* Empty rows to fill space if needed */}
                            {comparisonData.length > 0 && Array.from({ length: Math.max(0, 10 - comparisonData.length) }).map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                    <td className="border border-black p-2">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Signatures */}
                    <div className="mt-auto grid grid-cols-4 gap-4 pt-12 text-center text-xs font-bold uppercase">
                        <div className="border-t border-black pt-2">
                            TALEP EDEN
                            <div className="h-16 mt-2"></div>
                        </div>
                        <div className="border-t border-black pt-2">
                            HAZIRLAYAN
                            <div className="h-16 mt-2"></div>
                        </div>
                        <div className="border-t border-black pt-2">
                            KONTROL
                            <div className="h-16 mt-2"></div>
                        </div>
                        <div className="border-t border-black pt-2">
                            ONAY
                            <div className="h-16 mt-2"></div>
                        </div>
                    </div>

                    {/* Footer / Page Number */}
                    <div className="text-[10px] text-right text-gray-400 mt-4">
                        Loft 777 - Sistem Çıktısı - {printDate}
                    </div>

                </div>
            </div>
        </div>
    );
}
