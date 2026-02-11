'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, Calculator, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ConcreteProduct {
    id: string;
    name: string;
    unit_price: number;
    unit: string;
}

interface InvoiceItem {
    id: string; // temporary id for UI list
    mahal: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    allocation: 'Ortak' | 'Camsan' | 'Koparan';
}

export default function NewConcreteInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ConcreteProduct[]>([]);

    // Header State
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [waybillDate, setWaybillDate] = useState('');

    // Items State
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', mahal: '', product_id: '', quantity: 0, unit_price: 0, allocation: 'Ortak' }
    ]);

    // Totals
    const [totals, setTotals] = useState({
        subtotal: 0,
        tax: 0,
        grandTotal: 0,
        camsanShare: 0,
        koparanShare: 0
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [items]);

    async function fetchProducts() {
        const { data } = await supabase.from('concrete_products').select('*').order('name');
        if (data) setProducts(data);
    }

    function handleProductChange(index: number, productId: string) {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newItems = [...items];
        newItems[index].product_id = productId;
        newItems[index].unit_price = product.unit_price;
        setItems(newItems);
    }

    function calculateTotals() {
        let subtotal = 0;
        let camsanTotal = 0;
        let koparanTotal = 0;

        items.forEach(item => {
            const lineSubtotal = item.quantity * item.unit_price;
            const lineTax = lineSubtotal * 0.20; // %20 KDV
            const lineTotal = lineSubtotal + lineTax;

            subtotal += lineSubtotal;

            if (item.allocation === 'Camsan') {
                camsanTotal += lineTotal;
            } else if (item.allocation === 'Koparan') {
                koparanTotal += lineTotal;
            } else { // Ortak
                camsanTotal += lineTotal * 0.60;
                koparanTotal += lineTotal * 0.40;
            }
        });

        const tax = subtotal * 0.20;
        const grandTotal = subtotal + tax;

        setTotals({
            subtotal,
            tax,
            grandTotal,
            camsanShare: camsanTotal,
            koparanShare: koparanTotal
        });
    }

    function addItem() {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            mahal: '',
            product_id: '',
            quantity: 0,
            unit_price: 0,
            allocation: 'Ortak'
        }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

    async function handleSave() {
        if (!invoiceNo || !invoiceDate) {
            toast.error("Lütfen fatura numarası ve tarihini giriniz.");
            return;
        }

        if (items.some(i => !i.product_id || i.quantity <= 0)) {
            toast.error("Lütfen tüm satırlar için malzeme ve miktar giriniz.");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Invoice Header
            const { data: invoice, error: invError } = await supabase
                .from('concrete_invoices')
                .insert([{
                    invoice_number: invoiceNo,
                    invoice_date: invoiceDate,
                    waybill_date: waybillDate || null,
                    total_amount: totals.subtotal,
                    tax_amount: totals.tax,
                    grand_total: totals.grandTotal,
                    camsan_share: totals.camsanShare,
                    koparan_share: totals.koparanShare
                }])
                .select()
                .single();

            if (invError) throw invError;

            // 2. Create Invoice Items
            const invoiceItems = items.map(item => {
                const product = products.find(p => p.id === item.product_id);
                return {
                    invoice_id: invoice.id,
                    mahal: item.mahal,
                    product_id: item.product_id,
                    product_name: product?.name || 'Bilinmeyen',
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    allocation: item.allocation
                };
            });

            const { error: itemsError } = await supabase
                .from('concrete_invoice_items')
                .insert(invoiceItems);

            if (itemsError) throw itemsError;

            toast.success("Fatura başarıyla kaydedildi!");
            router.push('/faturalar');

        } catch (error: any) {
            console.error('Error saving invoice:', error);
            toast.error("Fatura kaydedilirken bir hata oluştu: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Yeni Canbek Faturası">
                <Link href="/faturalar">
                    <Button variant="outline" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-6 pb-32">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Header Info */}
                    <Card className="p-6 border-neutral-100 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Fatura No</Label>
                                <Input placeholder="Örn: SLN2026..." value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fatura Tarihi</Label>
                                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>İrsaliye Tarihi (Opsiyonel)</Label>
                                <Input type="date" value={waybillDate} onChange={e => setWaybillDate(e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    {/* Items Table */}
                    <Card className="overflow-hidden border-neutral-100 shadow-sm">
                        <div className="p-1 max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-neutral-50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="w-[150px]">Mahal / Blok</TableHead>
                                        <TableHead className="min-w-[200px]">Beton / Hizmet Cinsi</TableHead>
                                        <TableHead className="w-[100px]">Miktar (M³)</TableHead>
                                        <TableHead className="w-[120px]">Birim Fiyat</TableHead>
                                        <TableHead className="w-[120px]">Tutar</TableHead>
                                        <TableHead className="w-[140px]">Dağıtım</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell className="p-2">
                                                <Input
                                                    className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500 transition-all font-medium text-neutral-600 placeholder:text-neutral-300"
                                                    placeholder="A Blok..."
                                                    value={item.mahal}
                                                    onChange={(e) => {
                                                        const newItems = [...items];
                                                        newItems[index].mahal = e.target.value;
                                                        setItems(newItems);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Select value={item.product_id} onValueChange={(val) => handleProductChange(index, val)}>
                                                    <SelectTrigger className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500">
                                                        <SelectValue placeholder="Seçiniz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {products.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-right font-mono border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => {
                                                        const newItems = [...items];
                                                        newItems[index].quantity = parseFloat(e.target.value);
                                                        setItems(newItems);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <div className="text-right font-mono text-sm text-neutral-600 px-3">
                                                    {item.unit_price > 0 ?
                                                        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.unit_price)
                                                        : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <div className="text-right font-mono font-semibold text-neutral-700 px-3">
                                                    {item.quantity && item.unit_price ?
                                                        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.quantity * item.unit_price)
                                                        : '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Select
                                                    value={item.allocation}
                                                    onValueChange={(val: any) => {
                                                        const newItems = [...items];
                                                        newItems[index].allocation = val;
                                                        setItems(newItems);
                                                    }}
                                                >
                                                    <SelectTrigger className={`h-8 text-xs font-semibold border-transparent ${item.allocation === 'Ortak' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                                                        item.allocation === 'Camsan' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' :
                                                            'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                        }`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Ortak">Ortak (%60/40)</SelectItem>
                                                        <SelectItem value="Camsan">Sadece Camsan</SelectItem>
                                                        <SelectItem value="Koparan">Sadece Koparan</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2 text-center">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeItem(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-3 bg-neutral-50 border-t border-neutral-100">
                            <Button variant="outline" size="sm" onClick={addItem} className="gap-2 text-neutral-600 hover:text-blue-600 border-dashed">
                                <Plus className="w-4 h-4" />
                                Yeni Satır Ekle
                            </Button>
                        </div>
                    </Card>

                    {/* Summary Footer (Sticky) */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg z-20 md:pl-72">
                        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">

                            {/* Allocation Breakdown */}
                            <div className="flex gap-6 text-sm">
                                <div className="flex flex-col">
                                    <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Camsan Payı</span>
                                    <span className="font-mono font-bold text-purple-600 text-lg">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totals.camsanShare)}
                                    </span>
                                </div>
                                <div className="w-px h-10 bg-neutral-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Koparan Payı</span>
                                    <span className="font-mono font-bold text-orange-600 text-lg">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totals.koparanShare)}
                                    </span>
                                </div>
                            </div>

                            {/* Total Actions */}
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xs text-neutral-500">Ara Toplam: {new Intl.NumberFormat('tr-TR').format(totals.subtotal)} + KDV ({new Intl.NumberFormat('tr-TR').format(totals.tax)})</div>
                                    <div className="text-2xl font-bold text-zinc-800 font-mono">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totals.grandTotal)}
                                    </div>
                                </div>
                                <Button size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Kaydediliyor...' : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Faturayı Kaydet
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
