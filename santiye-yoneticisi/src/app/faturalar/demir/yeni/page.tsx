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
import { Plus, Trash2, Save, ArrowLeft, Container, Clock } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface InvoiceItem {
    id: string; // Group ID (description based)
    mahal: string; // Aggregated Mahals
    description: string;
    quantity: number;
    unit_price: number;
    allocation: string; // Summary or "Karma"
    sources: {
        id: string;
        type: 'wb' | 'ml';
        mahal: string;
        quantity: number;
        allocation: 'Camsan' | 'Koparan' | 'Ortak';
        sourceId: string;
    }[];
}

export default function NewIronInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Header State
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState('');

    useEffect(() => {
        setInvoiceDate(new Date().toISOString().split('T')[0]);
    }, []);
    const [supplier, setSupplier] = useState('ÖZTOP');
    const [notes, setNotes] = useState('');
    const [workType, setWorkType] = useState('Malzeme Faturası');
    const [category, setCategory] = useState('İnşaat Demiri');

    // Items State
    const [invoiceType, setInvoiceType] = useState('withholding'); // withholding (tev), standard (no tev)

    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', mahal: '', description: 'Ø10 Nervürlü Demir', quantity: 0, unit_price: 0, allocation: 'Ortak', sources: [] }
    ]);

    // Waybill Selection State
    const [availableWaybills, setAvailableWaybills] = useState<any[]>([]);
    const [selectedWaybills, setSelectedWaybills] = useState<string[]>([]);

    // Machine Log Selection State
    const [availableMachineLogs, setAvailableMachineLogs] = useState<any[]>([]);
    const [selectedMachineLogs, setSelectedMachineLogs] = useState<string[]>([]);

    // Totals
    const [totals, setTotals] = useState({
        subtotal: 0,
        tax: 0,
        withholding: 0,
        payableTax: 0,
        grandTotal: 0,
        camsanShare: 0,
        koparanShare: 0
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (supplier) {
            fetchWaybills();
            fetchMachineLogs();
        } else {
            setAvailableWaybills([]);
            setSelectedWaybills([]);
            setAvailableMachineLogs([]);
            setSelectedMachineLogs([]);
        }
    }, [supplier]);

    useEffect(() => {
        calculateTotals();
    }, [items, invoiceType]);

    async function fetchSuppliers() {
        const { data } = await supabase.from('suppliers').select('name').order('name');
        if (data) setSuppliers(data);
    }

    async function fetchWaybills() {
        // Fetch waybills for this supplier that are NOT linked to an invoice
        // Use ilike for case-insensitive match (Öztop vs ÖZTOP)
        const { data, error } = await supabase
            .from('waybills')
            .select('id, date, waybill_no, quantity, unit, location, notes, company, materials(name)')
            .ilike('supplier', supplier)
            .is('invoice_id', null)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching waybills:', error);
            // Fallback if materials join fails
            if (error.message.includes('materials')) {
                const { data: retryData } = await supabase
                    .from('waybills')
                    .select('id, date, waybill_no, quantity, unit, location, notes, company')
                    .eq('supplier', supplier)
                    .is('invoice_id', null)
                    .order('date', { ascending: false });
                if (retryData) {
                    setAvailableWaybills(retryData.map((wb: any) => ({
                        ...wb,
                        allocation: wb.company === 'Camsan&Koparan' ? 'Ortak' : (wb.company || 'Ortak')
                    })));
                }
            }
        } else if (data) {
            setAvailableWaybills(data.map((wb: any) => ({
                ...wb,
                allocation: wb.company === 'Camsan&Koparan' ? 'Ortak' : (wb.company || 'Ortak')
            })));
        }
    }

    async function fetchMachineLogs() {
        // Fetch machine logs (site_transactions) for this supplier that are NOT linked to an invoice
        // Filter by machine categories
        const { data, error } = await supabase
            .from('site_transactions')
            .select('*')
            .or(`firm_name.ilike.%${supplier}%,supplier_name.ilike.%${supplier}%`)
            .in('category', ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine', 'Hizmet'])
            .is('invoice_id', null)
            .order('transaction_date', { ascending: false });

        if (error) {
            console.error('Error fetching machine logs:', error);
        } else if (data) {
            setAvailableMachineLogs(data.map((log: any) => ({
                ...log,
                allocation: log.firm_name === 'Camsan&Koparan' ? 'Ortak' : (log.firm_name || 'Ortak')
            })));
        }
    }

    function calculateTotals() {
        let subtotal = 0;
        let camsanTotal = 0;
        let koparanTotal = 0;

        items.forEach(item => {
            const unitPrice = item.unit_price || 0;

            // For grouped items, we calculate based on individual source allocations
            item.sources.forEach(src => {
                const lineTotal = src.quantity * unitPrice;
                subtotal += lineTotal;

                if (src.allocation === 'Camsan') {
                    camsanTotal += lineTotal;
                } else if (src.allocation === 'Koparan') {
                    koparanTotal += lineTotal;
                } else { // Ortak
                    camsanTotal += lineTotal * 0.60;
                    koparanTotal += lineTotal * 0.40;
                }
            });

            // If it's a manual item (no sources)
            if (item.sources.length === 0) {
                const lineTotal = (item.quantity || 0) * unitPrice;
                subtotal += lineTotal;
                if (item.allocation === 'Camsan') {
                    camsanTotal += lineTotal;
                } else if (item.allocation === 'Koparan') {
                    koparanTotal += lineTotal;
                } else {
                    camsanTotal += lineTotal * 0.60;
                    koparanTotal += lineTotal * 0.40;
                }
            }
        });

        const tax = subtotal * 0.20;
        let withholding = 0;

        if (invoiceType === 'withholding') {
            withholding = tax * 0.5; // 5/10 Tevkifat
        }

        const payableTax = tax - withholding;
        const grandTotal = subtotal + payableTax;

        const totalBase = camsanTotal + koparanTotal;
        let camsanShare = 0;
        let koparanShare = 0;

        if (totalBase > 0) {
            camsanShare = (camsanTotal / totalBase) * grandTotal;
            koparanShare = (koparanTotal / totalBase) * grandTotal;
        }

        setTotals({
            subtotal,
            tax,
            withholding,
            payableTax,
            grandTotal,
            camsanShare,
            koparanShare
        });
    }

    function addItem() {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            mahal: '',
            description: '',
            quantity: 0,
            unit_price: 0,
            allocation: 'Ortak',
            sources: []
        }]);
    }

    function removeItem(index: number) {
        const itemToRemove = items[index];

        // Deselect associated waybills and logs
        if (itemToRemove.sources.length > 0) {
            const wbIdsToRemove = itemToRemove.sources.filter(s => s.type === 'wb').map(s => s.sourceId);
            const mlIdsToRemove = itemToRemove.sources.filter(s => s.type === 'ml').map(s => s.sourceId);

            if (wbIdsToRemove.length > 0) {
                setSelectedWaybills(prev => prev.filter(id => !wbIdsToRemove.includes(id)));
            }
            if (mlIdsToRemove.length > 0) {
                setSelectedMachineLogs(prev => prev.filter(id => !mlIdsToRemove.includes(id)));
            }
        }

        if (items.length === 1) {
            setItems([{ id: '1', mahal: '', description: '', quantity: 0, unit_price: 0, allocation: 'Ortak', sources: [] }]);
            return;
        }

        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    }

    function syncItemsWithSelection(wbIds: string[], mlIds: string[]) {
        setItems(prevItems => {
            const manualItems = prevItems.filter(i => i.sources.length === 0);

            // Collect all selected sources
            const selectedWbs = availableWaybills.filter(w => wbIds.includes(w.id));
            const selectedMls = availableMachineLogs.filter(l => mlIds.includes(l.id));

            const groups: Record<string, InvoiceItem> = {};

            selectedWbs.forEach(wb => {
                const desc = wb.materials?.name || 'Demir';
                if (!groups[desc]) {
                    groups[desc] = {
                        id: `group-${desc}`,
                        description: desc,
                        mahal: wb.location || '',
                        quantity: 0,
                        unit_price: 0,
                        allocation: 'Kayıtlara Göre',
                        sources: []
                    };
                }
                groups[desc].quantity += wb.quantity || 0;
                if (wb.location && !groups[desc].mahal.includes(wb.location)) {
                    groups[desc].mahal += (groups[desc].mahal ? ', ' : '') + wb.location;
                }
                groups[desc].sources.push({
                    id: `wb-${wb.id}`,
                    type: 'wb',
                    mahal: wb.location || '',
                    quantity: wb.quantity || 0,
                    allocation: wb.allocation || 'Ortak',
                    sourceId: wb.id
                });
            });

            selectedMls.forEach(ml => {
                const desc = `${ml.category} Çalışması`;
                if (!groups[desc]) {
                    groups[desc] = {
                        id: `group-${desc}`,
                        description: desc,
                        mahal: ml.district || '',
                        quantity: 0,
                        unit_price: ml.unit_price || 0,
                        allocation: 'Kayıtlara Göre',
                        sources: []
                    };
                }
                groups[desc].quantity += ml.quantity || 0;
                if (ml.district && !groups[desc].mahal.includes(ml.district)) {
                    groups[desc].mahal += (groups[desc].mahal ? ', ' : '') + ml.district;
                }
                groups[desc].sources.push({
                    id: `ml-${ml.id}`,
                    type: 'ml',
                    mahal: ml.district || '',
                    quantity: ml.quantity || 0,
                    allocation: ml.allocation || 'Ortak',
                    sourceId: ml.id
                });
            });

            // Re-apply existing unit prices if possible
            Object.keys(groups).forEach(key => {
                const existing = prevItems.find(i => i.description === key);
                if (existing) {
                    groups[key].unit_price = existing.unit_price;
                }
            });

            const automaticItems = Object.values(groups);

            // If everything is empty, return a default row
            if (manualItems.length === 0 && automaticItems.length === 0) {
                return [{ id: '1', mahal: '', description: '', quantity: 0, unit_price: 0, allocation: 'Ortak', sources: [] }];
            }

            // If we have automatic items and the only manual item is the empty default, remove the empty default
            if (automaticItems.length > 0 && manualItems.length === 1 && manualItems[0].description === '' && manualItems[0].quantity === 0) {
                return automaticItems;
            }

            return [...manualItems, ...automaticItems];
        });
    }

    async function handleSave() {
        if (!invoiceNo || !invoiceDate || !supplier) {
            toast.error("Lütfen fatura numarası, tarih ve tedarikçi giriniz.");
            return;
        }

        if (items.some(i => i.quantity <= 0)) {
            toast.error("Lütfen tüm satırlar için miktar giriniz.");
            return;
        }

        setLoading(true);

        try {
            // 1. Create Invoice Header
            const tevkifatRate = invoiceType === 'withholding' ? 0.5 : 0;

            const { data: invoice, error: invError } = await supabase
                .from('iron_invoices')
                .insert([{
                    invoice_number: invoiceNo,
                    invoice_date: invoiceDate,
                    supplier,
                    notes,
                    total_amount: totals.subtotal,
                    tax_amount: totals.tax,
                    tevkifat_rate: tevkifatRate,
                    tevkifat_amount: totals.withholding,
                    grand_total: totals.grandTotal,
                    camsan_share: totals.camsanShare,
                    koparan_share: totals.koparanShare,
                    account_processed: false,
                    work_type: workType,
                    category: category
                }])
                .select()
                .single();

            if (invError) throw invError;

            // 2. Create Invoice Items
            const expandedItems: any[] = [];
            items.forEach(item => {
                // Save exactly as seen in the table (grouped)
                expandedItems.push({
                    invoice_id: invoice.id,
                    mahal: item.mahal,
                    description: item.description,
                    quantity: item.quantity,
                    unit: 'Ton',
                    unit_price: item.unit_price,
                    allocation: item.sources.length > 0 ? 'Kayıtlara Göre' : item.allocation
                });
            });

            const { error: itemsError } = await supabase
                .from('iron_invoice_items')
                .insert(expandedItems);

            if (itemsError) throw itemsError;

            // 3. Link Selected Waybills
            if (selectedWaybills.length > 0) {
                const { error: linkError } = await supabase
                    .from('waybills')
                    .update({
                        invoice_id: invoice.id,
                        invoice_type: 'iron',
                        sync_status: true
                    })
                    .in('id', selectedWaybills);

                if (linkError) console.error('Error linking waybills:', linkError);
            }

            // 4. Link Selected Machine Logs (site_transactions)
            if (selectedMachineLogs.length > 0) {
                const { error: logLinkError } = await supabase
                    .from('site_transactions')
                    .update({
                        invoice_id: invoice.id,
                        invoice_type: 'iron'
                    })
                    .in('id', selectedMachineLogs);

                if (logLinkError) console.error('Error linking machine logs:', logLinkError);
            }

            toast.success("Fatura başarıyla kaydedildi!");
            router.push('/faturalar');

        } catch (error: any) {
            console.error('Error saving invoice:', error);
            // Friendly error for missing columns
            if (error.message?.includes("column") && error.message?.includes("does not exist")) {
                toast.error("Veritabanı güncellemesi gerekiyor (SQL Çalıştırın).");
            } else {
                toast.error("Hata: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    if (!mounted) {
        return <div className="flex items-center justify-center p-12 text-neutral-500">Yükleniyor...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]" translate="no" suppressHydrationWarning>
            <PageHeader title="Yeni Öztop Faturası">
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
                    <Card className="p-6 border-neutral-100 shadow-sm border-t-4 border-t-orange-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-2">
                                <Label>Tedarikçi</Label>
                                <Input value={supplier} disabled className="bg-neutral-50 font-medium text-neutral-600" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fatura Türü</Label>
                                <Select value={invoiceType} onValueChange={setInvoiceType}>
                                    <SelectTrigger className="font-medium text-blue-700 bg-blue-50 border-blue-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="withholding">Demir (Tevkifatlı - 5/10)</SelectItem>
                                        <SelectItem value="standard">Diğer (Tevkifatsız)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* New Row: Work Type and Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="workType">Fatura Türü (Cari)</Label>
                                <Select value={workType} onValueChange={setWorkType}>
                                    <SelectTrigger className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Malzeme Faturası">Malzeme Faturası</SelectItem>
                                        <SelectItem value="İş Mak. Çalış. Faturası">İş Mak. Çalış. Faturası</SelectItem>
                                        <SelectItem value="Hizmet Faturası">Hizmet Faturası</SelectItem>
                                        <SelectItem value="Nakliye Faturası">Nakliye Faturası</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-neutral-50 border-neutral-200">
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="İnşaat Demiri">İnşaat Demiri</SelectItem>
                                        <SelectItem value="Hazır Beton">Hazır Beton</SelectItem>
                                        <SelectItem value="İş Makinesi">İş Makinesi</SelectItem>
                                        <SelectItem value="Nakliye">Nakliye</SelectItem>
                                        <SelectItem value="Genel Gider">Genel Gider</SelectItem>
                                        <SelectItem value="Diğer">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="space-y-2">
                        <Label>Fatura No</Label>
                        <Input placeholder="Fatura numarası..." value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Fatura Tarihi</Label>
                        <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Fatura Notu</Label>
                    <Input placeholder="Opsiyonel açıklama..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
            </Card>

            {/* Items Table */}
            <Card className="overflow-hidden border-neutral-100 shadow-sm">
                <div className="p-1 max-h-[500px] overflow-y-auto">
                    <Table>
                        <TableHeader className="bg-neutral-50 sticky top-0">
                            <TableRow>
                                <TableHead className="w-[150px]">Mahal / Blok</TableHead>
                                <TableHead className="min-w-[200px]">Malzeme</TableHead>
                                <TableHead className="w-[120px]">Kime Ait?</TableHead>
                                <TableHead className="w-[100px]">Miktar (Ton)</TableHead>
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
                                        <Input
                                            className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500"
                                            placeholder="Örn: Ø12 Nervürlü"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].description = e.target.value;
                                                setItems(newItems);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        {item.sources.length > 0 ? (
                                            <div className="px-3 py-1 bg-neutral-100 rounded text-xs text-neutral-500 font-medium">
                                                Kayıtlara Göre
                                            </div>
                                        ) : (
                                            <Select value={item.allocation} onValueChange={(val: any) => {
                                                const newItems = [...items];
                                                newItems[index].allocation = val;
                                                setItems(newItems);
                                            }}>
                                                <SelectTrigger className="h-9 border-transparent bg-transparent hover:bg-white hover:border-neutral-200 focus:bg-white focus:border-blue-500">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Ortak">Ortak (%60/40)</SelectItem>
                                                    <SelectItem value="Camsan">Camsan (%100)</SelectItem>
                                                    <SelectItem value="Koparan">Koparan (%100)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
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
                                        <Input
                                            type="number"
                                            step="0.00001"
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
                                            <span>
                                                {item.quantity && item.unit_price ?
                                                    new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.quantity * item.unit_price)
                                                    : '-'}
                                            </span>
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
                    <Button variant="outline" size="sm" onClick={addItem} className="gap-2 text-neutral-600 hover:text-orange-600 border-dashed">
                        <Plus className="w-4 h-4" />
                        Yeni Satır Ekle
                    </Button>
                </div>
            </Card>

            {/* Waybill Selection */}
            {availableWaybills.length > 0 && (
                <Card className="p-6 border-neutral-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                        <Container className="w-5 h-5 text-orange-600" />
                        Bağlanabilir İrsaliyeler
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead className="w-[50px]">Seç</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>İrsaliye No</TableHead>
                                    <TableHead>Malzeme</TableHead>
                                    <TableHead>Miktar</TableHead>
                                    <TableHead>Mahal</TableHead>
                                    <TableHead>Şirket/Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableWaybills.map((wb) => (
                                    <TableRow key={`wb-${wb.id}`} className={selectedWaybills.includes(wb.id) ? "bg-orange-50" : ""}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                                checked={selectedWaybills.includes(wb.id)}
                                                onChange={(e) => {
                                                    let newSelected = [...selectedWaybills];
                                                    if (e.target.checked) {
                                                        newSelected.push(wb.id);
                                                    } else {
                                                        newSelected = newSelected.filter(id => id !== wb.id);
                                                    }
                                                    setSelectedWaybills(newSelected);
                                                    syncItemsWithSelection(newSelected, selectedMachineLogs);
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell><span>{new Date(wb.date).toLocaleDateString('tr-TR')}</span></TableCell>
                                        <TableCell><span>{wb.waybill_no || '-'}</span></TableCell>
                                        <TableCell><span>{wb.materials?.name || '-'}</span></TableCell>
                                        <TableCell><span>{wb.quantity} {wb.unit}</span></TableCell>
                                        <TableCell><span>{wb.location || '-'}</span></TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                wb.allocation === 'Camsan' ? "border-blue-200 bg-blue-50 text-blue-700" :
                                                    wb.allocation === 'Koparan' ? "border-green-200 bg-green-50 text-green-700" :
                                                        "border-neutral-200 bg-neutral-50 text-neutral-600"
                                            }>
                                                {wb.allocation || 'Ortak'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Machine Log Selection */}
            {availableMachineLogs.length > 0 && (
                <Card className="p-6 border-neutral-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Bağlanabilir Makine Çalışmaları
                    </h3>
                    <div className="border rounded-md overflow-hidden">
                        <Table>
                            <TableHeader className="bg-neutral-50">
                                <TableRow>
                                    <TableHead className="w-[50px]">Seç</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Makine</TableHead>
                                    <TableHead>Miktar/Süre</TableHead>
                                    <TableHead>Konum</TableHead>
                                    <TableHead>Açıklama</TableHead>
                                    <TableHead>Şirket/Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {availableMachineLogs.map((log) => (
                                    <TableRow key={`ml-${log.id}`} className={selectedMachineLogs.includes(log.id) ? "bg-blue-50" : ""}>
                                        <TableCell>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                checked={selectedMachineLogs.includes(log.id)}
                                                onChange={(e) => {
                                                    let newSelected = [...selectedMachineLogs];
                                                    if (e.target.checked) {
                                                        newSelected.push(log.id);
                                                    } else {
                                                        newSelected = newSelected.filter(id => id !== log.id);
                                                    }
                                                    setSelectedMachineLogs(newSelected);
                                                    syncItemsWithSelection(selectedWaybills, newSelected);
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell><span>{new Date(log.transaction_date).toLocaleDateString('tr-TR')}</span></TableCell>
                                        <TableCell><span>{log.category}</span></TableCell>
                                        <TableCell><span>{log.quantity} {log.unit}</span></TableCell>
                                        <TableCell><span>{log.district || '-'}</span></TableCell>
                                        <TableCell className="text-xs text-neutral-500 truncate max-w-[200px]" title={log.description}>
                                            <span>{log.description || '-'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                log.allocation === 'Camsan' ? "border-blue-200 bg-blue-50 text-blue-700" :
                                                    log.allocation === 'Koparan' ? "border-green-200 bg-green-50 text-green-700" :
                                                        "border-neutral-200 bg-neutral-50 text-neutral-600"
                                            }>
                                                {log.allocation || 'Ortak'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Summary Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg z-20 md:pl-72">
                <div className="max-w-5xl mx-auto flex items-center justify-end gap-6">
                    {/* Cost Allocation Summary */}
                    <div className="flex gap-4 border-r border-neutral-200 pr-6 mr-2">
                        <div className="text-right">
                            <div className="text-xs text-neutral-500 mb-1">Camsan Payı</div>
                            <div className="font-semibold text-neutral-700">
                                <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.camsanShare)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-neutral-500 mb-1">Koparan Payı</div>
                            <div className="font-semibold text-neutral-700">
                                <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.koparanShare)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-xs text-neutral-500">
                            Ara Toplam: <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.subtotal)}</span>
                        </div>
                        <div className="text-xs text-neutral-500">
                            + KDV (%20): <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.tax)}</span>
                        </div>
                        {totals.withholding > 0 && (
                            <div className="text-xs text-red-500 font-medium">
                                - Tevkifat (5/10): <span>{new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totals.withholding)}</span>
                            </div>
                        )}
                        <div className="text-2xl font-bold text-zinc-800 font-mono mt-1">
                            <span>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totals.grandTotal)}</span>
                        </div>
                    </div>
                    <Button size="lg" className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200" onClick={handleSave} disabled={loading}>
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
            </div >
        </div >
    );
}
