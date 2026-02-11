
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Trash2, Folder, Package, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/page-header";

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // all, insaat, hirdavat, elektrik

    useEffect(() => {
        fetchMaterials();
    }, []);

    async function fetchMaterials() {
        // Kullanıcı isteği: Sadece "İnşaat Demiri" olanlar listelensin
        const { data, error } = await supabase
            .from('materials')
            .select('*')
            .eq('category', 'İnşaat Demiri')
            .order('name', { ascending: true });

        if (data) setMaterials(data);
        setLoading(false);
    }

    // Filter Logic
    const filteredMaterials = materials.filter(m => {
        if (activeFilter === 'all') return true;
        return m.category && m.category.toLowerCase() === activeFilter;
    });

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Malzemeler">
                <div className="flex items-center gap-3">
                    <Link href="/malzemeler/yeni">
                        <Button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg p-0 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-white/20 mx-2"></div>
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
            </PageHeader>

            <div className="flex flex-1 overflow-hidden p-6 gap-6">

                {/* Left Sidebar (Filters) */}
                <div className="w-64 space-y-4 hidden md:block shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="p-4 flex flex-col items-center border-b bg-neutral-50/50">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg mb-2">
                                <Package className="w-6 h-6" />
                            </div>
                            <div className="text-sm font-semibold text-neutral-700">Stok Yönetimi</div>
                        </div>

                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'all' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Hepsi
                            </button>
                            <button
                                onClick={() => setActiveFilter('inşaat')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'inşaat' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> İnşaat
                            </button>
                            <button
                                onClick={() => setActiveFilter('hırdavat')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'hırdavat' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Hırdavat
                            </button>
                            <button
                                onClick={() => setActiveFilter('elektrik')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'elektrik' ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Elektrik
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden h-full">

                    {/* Toolbar */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
                            <Input placeholder="Malzeme Ara..." className="pl-8 h-9 text-sm bg-neutral-50 border-neutral-200" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-9 text-xs bg-[#2d3748] text-white border-none hover:bg-[#4a5568] hover:text-white">
                                <Filter className="w-3 h-3 mr-1" /> Filtrele
                            </Button>
                            <Button variant="outline" className="h-9 text-xs bg-green-500 text-white border-none hover:bg-green-600 hover:text-white">
                                <Download className="w-3 h-3 mr-1" /> Excel
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b border-neutral-100">
                                    <TableHead className="w-12 h-10"><Input type="checkbox" className="w-4 h-4 translate-y-0.5" /></TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Kod</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Malzeme Adı</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Birim</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Stok</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Kategori</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Marka</TableHead>
                                    <TableHead className="h-10 w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={8} className="text-center p-10 text-neutral-500">Yükleniyor...</TableCell></TableRow> :
                                    filteredMaterials.map((m) => (
                                        <TableRow key={m.id} className="group cursor-pointer hover:bg-neutral-50 border-b border-neutral-50">
                                            <TableCell className="py-3"><Input type="checkbox" className="w-4 h-4" /></TableCell>
                                            <TableCell className="font-mono text-xs py-3 text-neutral-600">{m.code}</TableCell>
                                            <TableCell className="font-medium py-3 text-neutral-700">
                                                <Link href={`/malzemeler/${m.id}`} className="hover:text-blue-600 hover:underline block">
                                                    {m.name}
                                                </Link>
                                                {m.current_stock <= m.min_stock_limit && (
                                                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded animate-pulse">KRİTİK</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-3 text-neutral-600 text-sm">{m.unit}</TableCell>
                                            <TableCell className="py-3 text-neutral-700 font-semibold">{m.current_stock}</TableCell>
                                            <TableCell className="py-3">
                                                <Badge variant="outline" className="font-normal text-neutral-500">{m.category}</Badge>
                                            </TableCell>
                                            <TableCell className="text-neutral-500 py-3 text-sm">{m.brand || '-'}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-600">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!loading && filteredMaterials.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center p-10 text-neutral-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="w-8 h-8 opacity-20" />
                                                <span>Henüz kayıtlı malzeme yok.</span>
                                                <Link href="/malzemeler/yeni"><Button variant="link" className="text-blue-600">Yeni Ekle</Button></Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-3 border-t bg-white flex justify-between items-center text-xs text-neutral-500">
                        <div>Toplam: {filteredMaterials.length} kayıt</div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 px-2 text-neutral-500" disabled>&lt;</Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-neutral-500" disabled>&gt;</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
