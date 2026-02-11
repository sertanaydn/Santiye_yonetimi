'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Plus, Trash2, Save, ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
}

const EXPENSE_CATEGORIES = [
    'Nalburiye ve Hırdavat',
    'Yemek ve Gıda',
    'Akaryakıt ve Ulaşım',
    'Nakliye ve Lojistik',
    'İş Güvenliği (KKD)',
    'Elektrik ve Su',
    'Konaklama',
    'Resmi Harçlar',
    'Diğer'
];

export default function NewGeneralInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Header State
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('');
    const [supplier, setSupplier] = useState('');
    const [description, setDescription] = useState('');

    // Items State
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', description: '', quantity: 1, unit: 'Adet', unit_price: 0 }
    ]);

    // Totals
    const [totals, setTotals] = useState({
        subtotal: 0,
        tax: 0,
        grandTotal: 0
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [items]);

    async function fetchSuppliers() {
        const { data } = await supabase.from('suppliers').select('name').order('name');
        if (data) setSuppliers(data);
    }

    function calculateTotals() {
        let subtotal = 0;

        items.forEach(item => {
            subtotal += item.quantity * item.unit_price;
        });

        const tax = subtotal * 0.20;
        const grandTotal = subtotal + tax;

        setTotals({ subtotal, tax, grandTotal });
    }

    function addItem() {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            quantity: 1,
            unit: 'Adet',
            unit_price: 0
        }]);
    }

    function removeItem(index: number) {
        if (items.length === 1) return;
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

    async function handleSave() {
        if (!invoiceNo || !invoiceDate || !supplier || !category) {
            toast.error("Lütfen tüm zorunlu alanları doldurunuz.");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Invoice Header
            const { data: invoice, error: invError } = await supabase
                .from('general_invoices')
                .insert([{
                    invoice_number: invoiceNo,
                    invoice_date: invoiceDate,
                    category,
                    supplier,
                    description,
                    total_amount: totals.subtotal,
                    tax_amount: totals.tax,
                    grand_total: totals.grandTotal
                }])
                .select()
                .single();

            if (invError) throw invError;

            // 2. Create Invoice Items
            const invoiceItems = items.map(item => ({
                invoice_id: invoice.id,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price
            }));

            const { error: itemsError } = await supabase
                .from('general_invoice_items')
                .insert(invoiceItems);

            if (itemsError) throw itemsError;

            toast.success("Gider faturası başarıyla kaydedildi!");
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
            <PageHeader title="Yeni Genel Fatura">
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
                    <Card className="p-6 border-neutral-100 shadow-sm border-t-4 border-t-green-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-2">
                                <Label>Gider Kategorisi</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXPENSE_CATEGORIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Tedarikçi</Label>
                                <Select value={supplier} onValueChange={setSupplier}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tedarikçi Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label>Fatura No</Label>
                                <Input placeholder="Fatura numarası..." value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Fatura Tarihi</Label>
                                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Açıklama</Label>
                                <Input placeholder="Genel açıklama..." value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                        </div>
                    </Card>

                    {/* Items Table */}
                    <Card className="overflow-hidden border-neutral-100 shadow-sm">
                        <div className="p-1 max-h-[500px] overflow-y-auto">
                            <Table>
                                <TableHeader className="bg-neutral-50 sticky top-0">
                                    <TableRow>
                                        <TableHead className="min-w-[250px]">Hizmet / Ürün Açıklaması</TableHead>
                                        <TableHead className="w-[100px]">Miktar</TableHead>
                                        <TableHead className="w-[100px]">Birim</TableHead>
                                        <TableHead className="w-[120px]">Birim Fiyat</TableHead>
                                        <TableHead className="w-[120px]">Tutar</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={item.id} className="group">
                                            <TableCell className="p-2">
                                                <Input
                                                    className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500"
                                                    placeholder="Örn: 100'lük Çivi"
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newItems = [...items];
                                                        newItems[index].description = e.target.value;
                                                        setItems(newItems);
                                                    }}
                                                />
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
                                                <Select value={item.unit} onValueChange={(val) => {
                                                    const newItems = [...items];
                                                    newItems[index].unit = val;
                                                    setItems(newItems);
                                                }}>
                                                    <SelectTrigger className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Adet">Adet</SelectItem>
                                                        <SelectItem value="Kutu">Kutu</SelectItem>
                                                        <SelectItem value="Kg">Kg</SelectItem>
                                                        <SelectItem value="Lt">Lt</SelectItem>
                                                        <SelectItem value="Mt">Mt</SelectItem>
                                                        <SelectItem value="Saat">Saat</SelectItem>
                                                        <SelectItem value="Gün">Gün</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <Input
                                                    type="number"
                                                    className="h-9 text-right font-mono border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500"
                                                    value={item.unit_price || ''}
                                                    onChange={(e) => {
                                                        const newItems = [...items];
                                                        newItems[index].unit_price = parseFloat(e.target.value);
                                                        setItems(newItems);
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell className="p-2">
                                                <div className="text-right font-mono font-semibold text-neutral-700 px-3">
                                                    {item.quantity && item.unit_price ?
                                                        new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(item.quantity * item.unit_price)
                                                        : '-'}
                                                </div>
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
                            <Button variant="outline" size="sm" onClick={addItem} className="gap-2 text-neutral-600 hover:text-green-600 border-dashed">
                                <Plus className="w-4 h-4" />
                                Yeni Satır Ekle
                            </Button>
                        </div>
                    </Card>

                    {/* Summary Footer */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg z-20 md:pl-72">
                        <div className="max-w-5xl mx-auto flex items-center justify-end gap-6">
                            <div className="text-right">
                                <div className="text-xs text-neutral-500">Ara Toplam: {new Intl.NumberFormat('tr-TR').format(totals.subtotal)} + KDV ({new Intl.NumberFormat('tr-TR').format(totals.tax)})</div>
                                <div className="text-2xl font-bold text-zinc-800 font-mono">
                                    {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totals.grandTotal)}
                                </div>
                            </div>
                            <Button size="lg" className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200" onClick={handleSave} disabled={loading}>
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
    );
}
