
'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Trash2, Eye, Folder, RefreshCcw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/page-header";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all'); // all, taseron, tedarikci, both

    useEffect(() => {
        fetchSuppliers();
    }, []);

    async function fetchSuppliers() {
        const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
        if (data) setSuppliers(data);
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Bu firmayı silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setSuppliers(suppliers.filter(s => s.id !== id));
            } else {
                alert("Silme işlemi başarısız oldu.");
            }
        } catch (e) {
            console.error(e);
            alert("Bir hata oluştu.");
        }
    }

    // Filter Logic
    const filteredSuppliers = suppliers.filter(s => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'taseron') return s.type && s.type.toLowerCase().includes('taşeron');
        if (activeFilter === 'tedarikci') return s.type && s.type.toLowerCase().includes('tedarikçi');
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Taşeron ve Tedarikçiler">
                <div className="flex items-center gap-3">
                    <Link href="/tedarikciler/yeni">
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
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mb-2">
                                T
                            </div>
                            <div className="text-sm font-semibold text-neutral-700">Tedarikçi Yönetimi</div>
                        </div>

                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'all' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Hepsi
                            </button>
                            <button
                                onClick={() => setActiveFilter('taseron')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'taseron' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Taşeron
                            </button>
                            <button
                                onClick={() => setActiveFilter('tedarikci')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeFilter === 'tedarikci' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Folder className="w-4 h-4" /> Tedarikçi
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
                            <Input placeholder="Firma Ara..." className="pl-8 h-9 text-sm bg-neutral-50 border-neutral-200" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="h-9 text-xs bg-[#2d3748] text-white border-none hover:bg-[#4a5568] hover:text-white">
                                <Filter className="w-3 h-3 mr-1" /> Filtrele
                            </Button>
                            <Button variant="outline" className="h-9 text-xs bg-green-500 text-white border-none hover:bg-green-600 hover:text-white">
                                <Download className="w-3 h-3 mr-1" /> Excel
                            </Button>
                            <Button variant="outline" className="h-9 text-xs bg-green-700 text-white border-none hover:bg-green-800 hover:text-white">
                                <Download className="w-3 h-3 mr-1" /> İçe Aktar
                            </Button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-neutral-50/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent border-b border-neutral-100">
                                    <TableHead className="w-12 h-10"><Input type="checkbox" className="w-4 h-4 translate-y-0.5" /></TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Firma Adı</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Firma Tipi</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Ticari Faaliyetler</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Email</TableHead>
                                    <TableHead className="h-10 text-xs font-bold text-neutral-400 uppercase tracking-wider">Telefon</TableHead>
                                    <TableHead className="h-10 w-24"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={7} className="text-center p-10 text-neutral-500">Yükleniyor...</TableCell></TableRow> :
                                    filteredSuppliers.map((s) => (
                                        <TableRow key={s.id} className="group cursor-pointer hover:bg-neutral-50 border-b border-neutral-50">
                                            <TableCell className="py-3"><Input type="checkbox" className="w-4 h-4" /></TableCell>
                                            <TableCell className="font-medium py-3 text-neutral-700">
                                                <Link href={`/tedarikciler/${s.id}`} className="hover:text-blue-600 hover:underline block">
                                                    {s.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="capitalize py-3 text-neutral-600 text-sm">{s.type}</TableCell>
                                            <TableCell className="py-3">
                                                {/* Malzemeler ileride eklenecek */}
                                            </TableCell>
                                            <TableCell className="text-neutral-500 py-3 text-sm">{s.email || '-'}</TableCell>
                                            <TableCell className="text-neutral-500 py-3 text-sm">{s.phone || '-'}</TableCell>
                                            <TableCell className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={`/tedarikciler/${s.id}/duzenle`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-blue-600">
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-600" onClick={() => handleDelete(s.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {!loading && filteredSuppliers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center p-10 text-neutral-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Search className="w-8 h-8 opacity-20" />
                                                <span>Henüz kayıtlı firma yok.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-3 border-t bg-white flex justify-between items-center text-xs text-neutral-500">
                        <div>Toplam: {filteredSuppliers.length} kayıt | 1 - {filteredSuppliers.length} arası gösteriliyor</div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 mr-4">
                                <span>Sayfa: 1/1</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-neutral-500" disabled>&lt;</Button>
                            <Button variant="outline" size="sm" className="h-7 px-2 text-neutral-500" disabled>&gt;</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
