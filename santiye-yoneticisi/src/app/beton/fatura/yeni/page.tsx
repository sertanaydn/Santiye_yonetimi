'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface LineItem {
    id: string;
    mahal: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    allocation: 'Camsan' | 'Koparan' | 'Ortak';
}

export default function NewConcreteInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    // Invoice Header
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [waybillDate, setWaybillDate] = useState('');

    // Line Items
    const [items, setItems] = useState<LineItem[]>([{
        id: crypto.randomUUID(),
        mahal: '',
        product_id: '',
        product_name: '',
        quantity: 0,
        unit_price: 0,
        allocation: 'Ortak'
    }]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('concrete_products')
            .select('*')
            .order('name');

        if (error) {
            console.error(error);
            toast.error('Ürünler yüklenemedi');
        } else {
            setProducts(data || []);
        }
    };

    const addRow = () => {
        setItems([...items, {
            id: crypto.randomUUID(),
            mahal: '',
            product_id: '',
            product_name: '',
            quantity: 0,
            unit_price: 0,
            allocation: 'Ortak'
        }]);
    };

    const removeRow = (id: string) => {
        if (items.length === 1) {
            toast.error('En az bir satır olmalı');
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };

                // Auto-populate price when product is selected
                if (field === 'product_id') {
                    const product = products.find(p => p.id === value);
                    if (product) {
                        updated.product_name = product.name;
                        updated.unit_price = product.unit_price;
                    }
                }

                return updated;
            }
            return item;
        }));
    };

    const calculateTotals = () => {
        let totalAmount = 0;
        let taxAmount = 0;
        let camsanShare = 0;
        let koparanShare = 0;

        items.forEach(item => {
            const subtotal = item.quantity * item.unit_price;
            const tax = subtotal * 0.20;
            const total = subtotal + tax;

            totalAmount += subtotal;
            taxAmount += tax;

            if (item.allocation === 'Ortak') {
                camsanShare += total * 0.60;
                koparanShare += total * 0.40;
            } else if (item.allocation === 'Camsan') {
                camsanShare += total;
            } else {
                koparanShare += total;
            }
        });

        return {
            totalAmount,
            taxAmount,
            grandTotal: totalAmount + taxAmount,
            camsanShare,
            koparanShare
        };
    };

    const handleSave = async () => {
        if (!invoiceNumber || !invoiceDate) {
            toast.error('Fatura No ve Tarih zorunludur');
            return;
        }

        if (items.some(item => !item.mahal || !item.product_id || item.quantity <= 0)) {
            toast.error('Tüm satırları eksiksiz doldurun');
            return;
        }

        setLoading(true);

        try {
            const totals = calculateTotals();
            const checkDueDate = new Date(invoiceDate);
            checkDueDate.setDate(checkDueDate.getDate() + 120);

            // Create invoice header
            const { data: invoice, error: invoiceError } = await supabase
                .from('concrete_invoices')
                .insert({
                    invoice_number: invoiceNumber,
                    invoice_date: invoiceDate,
                    waybill_date: waybillDate || null,
                    check_due_date: checkDueDate.toISOString().split('T')[0],
                    total_amount: totals.totalAmount,
                    tax_amount: totals.taxAmount,
                    grand_total: totals.grandTotal,
                    camsan_share: totals.camsanShare,
                    koparan_share: totals.koparanShare
                })
                .select()
                .single();

            if (invoiceError) throw invoiceError;

            // Create line items
            const lineItems = items.map(item => ({
                invoice_id: invoice.id,
                mahal: item.mahal,
                product_id: item.product_id,
                product_name: item.product_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.quantity * item.unit_price,
                tax_amount: item.quantity * item.unit_price * 0.20,
                total: item.quantity * item.unit_price * 1.20,
                allocation: item.allocation
            }));

            const { error: itemsError } = await supabase
                .from('concrete_invoice_items')
                .insert(lineItems);

            if (itemsError) throw itemsError;

            toast.success('Fatura kaydedildi!');
            router.push(`/beton/fatura/${invoice.id}`);
        } catch (error: any) {
            console.error(error);
            toast.error('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Beton Fatura Girişi" subtitle="Yeni fatura oluşturun">
                <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
            </PageHeader>

            <div className="flex-1 p-6 overflow-auto">
                {/* Invoice Header */}
                <Card className="p-6 mb-6 bg-white border-neutral-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">FATURA GİRİŞ EKRANI</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label>Fatura No</Label>
                            <Input
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="SLN20260000000089"
                            />
                        </div>
                        <div>
                            <Label>Fatura Tarihi</Label>
                            <Input
                                type="date"
                                value={invoiceDate}
                                onChange={(e) => setInvoiceDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>İrsaliye Tarihi</Label>
                            <Input
                                type="date"
                                value={waybillDate}
                                onChange={(e) => setWaybillDate(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                {/* Line Items Table */}
                <Card className="p-6 bg-white border-neutral-200 shadow-sm">
                    <Table>
                        <TableHeader className="bg-red-100">
                            <TableRow>
                                <TableHead className="font-bold">Mahal</TableHead>
                                <TableHead className="font-bold">Beton Cinsi</TableHead>
                                <TableHead className="font-bold">Miktar</TableHead>
                                <TableHead className="font-bold">Birim</TableHead>
                                <TableHead className="font-bold">Birim Fiyat</TableHead>
                                <TableHead className="font-bold">Kime Ait</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Input
                                            value={item.mahal}
                                            onChange={(e) => updateItem(item.id, 'mahal', e.target.value)}
                                            placeholder="A BLOK 2. Bod. Tabliye"
                                            className="min-w-[200px]"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={item.product_id}
                                            onValueChange={(val) => updateItem(item.id, 'product_id', val)}
                                        >
                                            <SelectTrigger className="min-w-[250px]">
                                                <SelectValue placeholder="Seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">M3</TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {item.unit_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={item.allocation}
                                            onValueChange={(val: any) => updateItem(item.id, 'allocation', val)}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Ortak">ORTAK</SelectItem>
                                                <SelectItem value="Camsan">Camsan</SelectItem>
                                                <SelectItem value="Koparan">Koparan</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeRow(item.id)}
                                            className="h-8 w-8 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <Button onClick={addRow} variant="outline" className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Satır Ekle
                    </Button>

                    {/* Summary */}
                    <div className="mt-8 grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">Ara Toplam:</span>
                                <span className="font-mono">{totals.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">KDV (%20):</span>
                                <span className="font-mono">{totals.taxAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Genel Toplam:</span>
                                <span className="font-mono">{totals.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                            </div>
                        </div>

                        <div className="space-y-2 bg-green-50 p-4 rounded">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold">Camsan Payı:</span>
                                <span className="font-mono font-bold">{totals.camsanShare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold">Koparan Payı:</span>
                                <span className="font-mono font-bold">{totals.koparanShare.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                                <span className="font-bold">Çek Vadesi:</span>
                                <span className="font-mono">{new Date(new Date(invoiceDate).getTime() + 120 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
