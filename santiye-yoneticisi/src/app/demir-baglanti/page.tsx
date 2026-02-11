
'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Plus, Archive, Truck, ArrowRight, Wallet, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Static lists for v2 MVP
const MATERIAL_GROUPS = ["İnce Demir (Ø8-Ø10)", "Kalın Demir (Ø12-Ø20)", "Hasır Çelik"];
const SUPPLIERS = ["Öztop", "Camsan", "Koparan", "Diğer"];

export default function IronConnectionPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'dashboard' | 'new-contract'>('dashboard');

    const [transactions, setTransactions] = useState<any[]>([]);
    const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

    // New Contract Form State
    const [newContract, setNewContract] = useState({
        supplier: '',
        material_group: '',
        total_quantity: '',
        unit_price: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchContracts();
        fetchTransactions();
    }, []);

    async function fetchContracts() {
        // Fetch active contracts
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .order('created_at', { ascending: false }); // Show all, not just active? Or maybe keep active filter. Removed active filter for history visibility if needed, but keeping simple for now.

        if (data) setContracts(data);
        setLoading(false);
    }

    async function fetchTransactions() {
        const { data } = await supabase
            .from('site_transactions')
            .select('*')
            .not('contract_id', 'is', null)
            .order('transaction_date', { ascending: false });

        if (data) setTransactions(data);
    }

    const getContractTransactions = (contractId: string) => {
        const raw = transactions.filter(t => t.contract_id === contractId);

        // Group by Waybill No (document_no) + Date
        const grouped: any[] = [];
        const map = new Map<string, any>();

        raw.forEach(t => {
            // Include empty document_no as unique items (don't group)
            if (!t.document_no) {
                grouped.push(t);
                return;
            }

            const key = `${t.document_no}-${t.transaction_date}`;

            if (map.has(key)) {
                const existing = map.get(key);
                existing.quantity = Number(existing.quantity) + Number(t.quantity);
                existing.total_amount = Number(existing.total_amount) + Number(t.total_amount); // Also sum total amount if wanted

                const desc = t.description + (t.detail ? ` (${t.detail})` : '');
                // Avoid duplicates in description list
                if (!existing._descriptions.includes(desc)) {
                    existing._descriptions.push(desc);
                }
            } else {
                const newItem = {
                    ...t,
                    quantity: Number(t.quantity),
                    total_amount: Number(t.total_amount),
                    _descriptions: [t.description + (t.detail ? ` (${t.detail})` : '')]
                };
                map.set(key, newItem);
                grouped.push(newItem);
            }
        });

        // Format descriptions
        return grouped.map(g => {
            if (g._descriptions) {
                return {
                    ...g,
                    description: g._descriptions.join(', '),
                    detail: '' // Clear detail since it's merged
                };
            }
            return g;
        }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
    };

    const handleCreateContract = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.from('contracts').insert([{
            supplier: newContract.supplier,
            material_group: newContract.material_group,
            total_quantity: parseFloat(newContract.total_quantity),
            unit_price: parseFloat(newContract.unit_price),
            start_date: newContract.date,
            status: 'active'
        }]);

        if (error) {
            toast.error("Hata: " + error.message);
        } else {
            toast.success("Bağlantı Kaydedildi! 🎉");
            setView('dashboard');
            fetchContracts();
        }
        setLoading(false);
    };

    // Calculate Totals
    const totalIronStock = contracts.reduce((acc, c) => acc + (Number(c.remaining_quantity) || Number(c.total_quantity)), 0);
    const activeDeals = contracts.filter(c => c.status === 'active').length;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Demir Bağlantı & Stok (v2)" backLink="/">
                <Button onClick={() => setView('new-contract')} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Yeni Bağlantı
                </Button>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
                        <CardContent className="p-5">
                            <div className="text-sm text-neutral-500 font-medium uppercase tracking-wide">Toplam Demir Bağlantısı</div>
                            <div className="text-3xl font-bold text-neutral-800 mt-1">{totalIronStock.toLocaleString('tr-TR')} <span className="text-lg text-neutral-400 font-normal">Ton</span></div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-l-4 border-l-purple-600 shadow-sm">
                        <CardContent className="p-5">
                            <div className="text-sm text-neutral-500 font-medium uppercase tracking-wide">Aktif Anlaşmalar</div>
                            <div className="text-3xl font-bold text-neutral-800 mt-1">{activeDeals} <span className="text-lg text-neutral-400 font-normal">Adet</span></div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-l-4 border-l-green-600 shadow-sm">
                        <CardContent className="p-5">
                            <div className="text-sm text-neutral-500 font-medium uppercase tracking-wide">Sevk Bekleyen</div>
                            <div className="text-3xl font-bold text-neutral-800 mt-1">{totalIronStock.toLocaleString('tr-TR')} <span className="text-lg text-neutral-400 font-normal">Ton</span></div>
                        </CardContent>
                    </Card>
                </div>

                {view === 'new-contract' && (
                    <Card className="border-blue-100 bg-blue-50/50 shadow-sm animate-in slide-in-from-top-2">
                        <CardHeader>
                            <CardTitle className="text-blue-700">Yeni Demir Bağlantısı Ekle</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateContract} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500">Tarih</label>
                                    <Input type="date" value={newContract.date} onChange={e => setNewContract({ ...newContract, date: e.target.value })} required className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500">Tedarikçi</label>
                                    <Select onValueChange={val => setNewContract({ ...newContract, supplier: val })} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Seç" /></SelectTrigger>
                                        <SelectContent>
                                            {SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500">Malzeme Grubu</label>
                                    <Select onValueChange={val => setNewContract({ ...newContract, material_group: val })} required>
                                        <SelectTrigger className="bg-white"><SelectValue placeholder="Seç" /></SelectTrigger>
                                        <SelectContent>
                                            {MATERIAL_GROUPS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500">Miktar (Ton)</label>
                                    <Input type="number" placeholder="Örn: 150" value={newContract.total_quantity} onChange={e => setNewContract({ ...newContract, total_quantity: e.target.value })} required className="bg-white font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500">Birim Fiyat (TL + KDV)</label>
                                    <Input type="number" placeholder="Örn: 25416.67" step="0.01" value={newContract.unit_price} onChange={e => setNewContract({ ...newContract, unit_price: e.target.value })} required className="bg-white font-mono" />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                                    <Button type="button" variant="ghost" onClick={() => setView('dashboard')}>İptal</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Bağlantıyı Kaydet</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Active Contracts List */}
                <Card className="shadow-sm border-none">
                    <CardHeader className="bg-white border-b px-6 py-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base font-semibold text-neutral-700 flex items-center gap-2">
                                <Wallet className="w-4 h-4 text-neutral-400" />
                                Aktif Bağlantılarım
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead>Tedarikçi</TableHead>
                                    <TableHead>Ürün Grubu</TableHead>
                                    <TableHead className="text-right">Anlaşılan Miktar</TableHead>
                                    <TableHead className="text-right">Birim Fiyat</TableHead>
                                    <TableHead className="text-right">Kalan Miktar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? <TableRow><TableCell colSpan={7} className="text-center p-8">Yükleniyor...</TableCell></TableRow> :
                                    contracts.map((c) => (
                                        <React.Fragment key={c.id}>
                                            <TableRow className={`group hover:bg-neutral-50 ${expandedContractId === c.id ? 'bg-blue-50' : ''}`}>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedContractId(expandedContractId === c.id ? null : c.id)}>
                                                        {expandedContractId === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-neutral-500">{new Date(c.start_date).toLocaleDateString('tr-TR')}</TableCell>
                                                <TableCell className="font-medium text-neutral-700">{c.supplier}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal bg-neutral-100 text-neutral-600 border-neutral-200">
                                                        {c.material_group}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-neutral-900">{Number(c.total_quantity).toLocaleString('tr-TR')} Ton</TableCell>
                                                <TableCell className="text-right font-mono text-xs text-neutral-600">₺{Number(c.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="text-right font-bold text-green-600 text-lg">
                                                    {Number(c.remaining_quantity || c.total_quantity - (c.delivered_quantity || 0)).toLocaleString('tr-TR')} <span className="text-xs font-normal text-neutral-400">Ton</span>
                                                </TableCell>
                                            </TableRow>
                                            {/* EXPANDED DETAILS */}
                                            {expandedContractId === c.id && (
                                                <TableRow className="bg-blue-50/30">
                                                    <TableCell colSpan={7} className="p-0">
                                                        <div className="p-4 pl-12">
                                                            <div className="bg-white rounded border shadow-sm overflow-hidden">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow className="bg-neutral-100 h-8">
                                                                            <TableHead className="h-8 text-xs font-bold text-neutral-600">İşlem Tarihi</TableHead>
                                                                            <TableHead className="h-8 text-xs font-bold text-neutral-600">İrsaliye No</TableHead>
                                                                            <TableHead className="h-8 text-xs font-bold text-neutral-600">Açıklama / Detay</TableHead>
                                                                            <TableHead className="h-8 text-xs font-bold text-neutral-600 text-right">Miktar (Ton/Adet)</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {getContractTransactions(c.id).length === 0 ? (
                                                                            <TableRow>
                                                                                <TableCell colSpan={4} className="text-center text-xs text-neutral-400 py-4">Bu bağlantıdan henüz düşüm yapılmamış.</TableCell>
                                                                            </TableRow>
                                                                        ) : getContractTransactions(c.id).map(t => (
                                                                            <TableRow key={t.id} className="h-8">
                                                                                <TableCell className="text-xs py-1">{new Date(t.transaction_date).toLocaleDateString('tr-TR')}</TableCell>
                                                                                <TableCell className="text-xs py-1 font-mono text-blue-600">{t.document_no || '-'}</TableCell>
                                                                                <TableCell className="text-xs py-1">{t.description} {t.detail ? `(${t.detail})` : ''}</TableCell>
                                                                                <TableCell className="text-xs py-1 text-right font-bold text-neutral-700">{Number(t.quantity).toLocaleString('tr-TR')}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                {contracts.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center p-12 text-neutral-400">
                                            Henüz aktif bağlantınız yok. Yukarıdan ekleyebilirsiniz.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
