'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Filter, TrendingDown, ArrowUpRight, Printer, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PriceEntry {
    id: string;
    date: string;
    firm_name: string;
    product_name: string;
    detail: string;
    unit: string;
    price: number;
    currency: string;
    vat_rate: number;
    notes: string;
}

export default function PriceComparisonDashboard() {
    const router = useRouter();
    const [entries, setEntries] = useState<PriceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('price_entries')
            .select('*')
            .order('date', { ascending: false }); // Get latest prices first

        if (data) setEntries(data);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Bu fiyat kaydını silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase.from('price_entries').delete().eq('id', id);
            if (error) throw error;
            toast.success('Kayıt silindi');
            fetchEntries();
        } catch (error: any) {
            toast.error('Silinirken hata oluştu');
        }
    };

    // --- PIVOT LOGIC ---

    // 1. Get Unique Firms (Columns)
    const firms = Array.from(new Set(entries.map(e => e.firm_name))).sort();

    // 2. Group by Product + Detail (Rows)
    // We want the LATEST price for each firm for that product
    const [groupByDate, setGroupByDate] = useState(false);

    // ... existing grouping logic ...

    const productGroups: Record<string, Record<string, PriceEntry>> = {};

    entries.forEach(entry => {
        const productKey = (entry.product_name || '').trim();
        const detailKey = (entry.detail || '').trim() || '-';

        let key = `${productKey}::${detailKey}`;

        if (groupByDate) {
            const dateKey = new Date(entry.date).toLocaleDateString('tr-TR');
            key = `${dateKey}::${productKey}::${detailKey}`;
        }

        if (!productGroups[key]) {
            productGroups[key] = {};
        }

        // Logic:
        // If Group By Date -> we have a unique row for that date, so we just map firms.
        // If NOT Group By Date (Standard) -> we only keep the LATEST entry for that firm.
        if (groupByDate) {
            productGroups[key][entry.firm_name] = entry;
        } else {
            if (!productGroups[key][entry.firm_name]) {
                productGroups[key][entry.firm_name] = entry;
            }
        }
    });

    const rows = Object.entries(productGroups).map(([key, firmMap]) => {
        let date = '';
        let productName = '';
        let detail = '';

        if (groupByDate) {
            const parts = key.split('::');
            date = parts[0];
            productName = parts[1];
            detail = parts[2];
        } else {
            const parts = key.split('::');
            productName = parts[0];
            detail = parts[1];
        }

        // Find min price for highlighting
        const prices = Object.values(firmMap).map(e => e.price);
        const minPrice = Math.min(...prices);

        return {
            key,
            date,
            productName,
            detail: detail === '-' ? '' : detail,
            firmMap,
            minPrice,
            // For filtering
            searchText: `${productName} ${detail} ${date}`.toLowerCase()
        };
    }).filter(row => row.searchText.includes(filterText.toLowerCase()));

    // Sort rows
    // If grouped by date, sort by Date Desc, then Product
    // If not, sort by Product
    rows.sort((a, b) => {
        if (groupByDate) {
            // custom date sort if needed, simplified for string comparison YYYY layout would be better but TR format is DD.MM.YYYY
            // Let's rely on standard string split for sort or just keep original order
            return a.key.localeCompare(b.key);
        }
        return a.productName.localeCompare(b.productName);
    });


    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Fiyat Karşılaştırma" subtitle="PİYASA ANALİZİ & SATIN ALMA" />

            <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">

                {/* Actions Bar - Hidden on Print */}
                <div className="flex justify-between items-center bg-white p-3 rounded-sm border shadow-sm print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-2 rounded-md border border-neutral-200">
                            <Checkbox
                                id="groupby-date"
                                checked={groupByDate}
                                onCheckedChange={(c) => setGroupByDate(c === true)}
                            />
                            <label
                                htmlFor="groupby-date"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                                Tarihe Göre Ayır
                            </label>
                        </div>

                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                            <Input
                                placeholder="Ürün veya detay ara..."
                                className="pl-8 h-8 w-64 bg-gray-50 border-gray-200"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="sm" className="gap-2 h-8 text-neutral-600">
                            <Filter className="w-3 h-3" />
                            Filtrele
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2 h-8" onClick={() => window.print()}>
                            <Printer className="w-4 h-4" />
                            Yazdır / PDF
                        </Button>
                        <Link href="/fiyat-karsilastirma/karar-formu">
                            <Button variant="secondary" size="sm" className="gap-2 h-8 hover:bg-neutral-200">
                                <FileText className="w-4 h-4" />
                                Karar Formu Oluştur
                            </Button>
                        </Link>
                        <Link href="/fiyat-karsilastirma/veri-girisi">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-2 h-8">
                                <Plus className="w-4 h-4" />
                                Yeni Fiyat Gir
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* MATRIX TABLE */}
                <Card className="flex-1 overflow-auto border-neutral-200 shadow-sm rounded-sm bg-white">
                    <Table>
                        <TableHeader className="bg-neutral-50 sticky top-0 z-10 shadow-sm">
                            <TableRow className="hover:bg-transparent border-b border-neutral-200">
                                {groupByDate && (
                                    <TableHead className="w-[120px] font-bold text-neutral-600 sticky left-0 z-20 bg-neutral-50 border-r border-neutral-200">TARİH</TableHead>
                                )}
                                <TableHead className={`w-[200px] font-bold text-neutral-600 ${groupByDate ? '' : 'sticky left-0 z-20 bg-neutral-50 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'}`}>ÜRÜN</TableHead>
                                <TableHead className="w-[150px] font-bold text-neutral-600 border-r">DETAY</TableHead>
                                {firms.map(firm => (
                                    <TableHead key={firm} className="text-center font-bold text-neutral-700 border-r last:border-r-0 min-w-[140px] px-2 bg-neutral-50/50">
                                        {firm}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={2 + firms.length} className="text-center h-24">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2 + firms.length} className="text-center h-24 text-neutral-500">
                                        Kayıt bulunamadı. "Yeni Fiyat Gir" butonu ile veri ekleyin.
                                    </TableCell>
                                </TableRow>
                            ) : rows.map((row) => (
                                <TableRow key={row.key} className="hover:bg-neutral-50/50 transition-colors border-b border-neutral-100 last:border-0">
                                    {groupByDate && (
                                        <TableCell className="font-bold text-neutral-500 sticky left-0 z-10 bg-white border-r">
                                            {row.date}
                                        </TableCell>
                                    )}
                                    <TableCell className={`font-medium text-neutral-700 ${groupByDate ? '' : 'sticky left-0 z-10 bg-white shadow-[1px_0_0_0_rgba(0,0,0,0.05)]'}`}>
                                        {row.productName}
                                    </TableCell>
                                    <TableCell className="text-sm text-neutral-600 border-r">
                                        {row.detail}
                                    </TableCell>
                                    {firms.map(firm => {
                                        const entry = row.firmMap[firm];
                                        const isMin = entry?.price === row.minPrice;

                                        return (
                                            <TableCell key={firm} className={`text-center h-16 align-middle border-r last:border-r-0 relative group ${isMin ? 'bg-green-50' : ''}`}>
                                                {entry ? (
                                                    <div className="flex flex-col items-center justify-center h-full w-full">
                                                        <div className={`font-bold ${isMin ? 'text-green-700' : 'text-neutral-700'}`}>
                                                            {entry.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {entry.currency}
                                                        </div>
                                                        <div className="text-[10px] text-neutral-400 mt-0.5">
                                                            {new Date(entry.date).toLocaleDateString('tr-TR')}
                                                        </div>
                                                        {/* Delete Button (Visible on Hover) */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(entry.id);
                                                            }}
                                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-opacity print:hidden"
                                                            title="Sil"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-300">-</span>
                                                )}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
