
'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package, TrendingUp, TrendingDown, History, Construction, Truck } from "lucide-react";

export default function MaterialDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [material, setMaterial] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    async function fetchData() {
        try {
            // 1. Get Material Info
            const matRes = await fetch(`/api/materials?id=${id}`);
            const matData = await matRes.json();
            setMaterial(matData);

            // 2. Get Transaction History
            const transRes = await fetch(`/api/material-transactions?material_id=${id}`);
            const transData = await transRes.json();
            if (Array.isArray(transData)) setTransactions(transData);

        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-neutral-500">Yükleniyor...</div>;
    if (!material) return <div className="p-8 text-center text-red-500">Malzeme bulunamadı</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title={material.name} backLink="/malzemeler" />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4 pt-4">
                            <div className="text-sm text-neutral-500">Mevcut Stok</div>
                            <div className="text-2xl font-bold text-blue-700">{material.current_stock} {material.unit}</div>
                            <div className="text-xs text-neutral-400 mt-1">Son Güncelleme: Bugün</div>
                        </CardContent>
                    </Card>

                    <Card className={material.current_stock <= material.min_stock_limit ? "border-l-4 border-l-red-500 shadow-sm bg-red-50" : "border-l-4 border-l-orange-500 shadow-sm"}>
                        <CardContent className="p-4 pt-4">
                            <div className="text-sm text-neutral-500">Kritik Stok Limiti</div>
                            <div className="text-2xl font-bold text-neutral-700">{material.min_stock_limit} {material.unit}</div>
                            {material.current_stock <= material.min_stock_limit && (
                                <div className="text-xs text-red-600 font-bold mt-1">⚠️ STOK KRİTİK SEVİYEDE</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardContent className="p-4 pt-4">
                            <div className="text-sm text-neutral-500">Kategori / Marka</div>
                            <div className="text-lg font-semibold text-neutral-700">{material.category}</div>
                            <div className="text-xs text-neutral-400">{material.brand || '-'}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                <Card className="border-neutral-200 shadow-sm flex-1">
                    <CardHeader className="bg-neutral-50/50 border-b py-3 px-4">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-neutral-700">
                            <History className="w-4 h-4 text-purple-500" />
                            Stok Hareket Geçmişi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-neutral-50/50">
                                <TableRow>
                                    <TableHead className="w-[120px]">Tarih</TableHead>
                                    <TableHead className="w-[100px]">İşlem</TableHead>
                                    <TableHead>Açıklama / Kaynak</TableHead>
                                    <TableHead className="text-right">Miktar</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center p-8 text-neutral-500">Henüz işlem yok.</TableCell>
                                    </TableRow>
                                ) : (
                                    transactions.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-neutral-50">
                                            <TableCell className="text-xs text-neutral-500">
                                                {new Date(t.created_at).toLocaleDateString("tr-TR")}
                                                <br />
                                                <span className="text-[10px] opacity-70">{new Date(t.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}</span>
                                            </TableCell>
                                            <TableCell>
                                                {t.transaction_type === 'IN' ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none px-2 shadow-none">
                                                        <TrendingUp className="w-3 h-3 mr-1" /> GİRİŞ
                                                    </Badge>
                                                ) : t.transaction_type === 'OUT' ? (
                                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none px-2 shadow-none">
                                                        <TrendingDown className="w-3 h-3 mr-1" /> ÇIKIŞ
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">DÜZELTME</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-neutral-600">
                                                {t.waybills ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium flex items-center gap-1"><Truck className="w-3 h-3 text-blue-400" /> İrsaliye: {t.waybills.supplier}</span>
                                                        <span className="text-xs text-neutral-400">Tarih: {t.waybills.date}</span>
                                                    </div>
                                                ) : t.projects ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium flex items-center gap-1"><Construction className="w-3 h-3 text-orange-400" /> Proje: {t.projects.name}</span>
                                                    </div>
                                                ) : (
                                                    <span>{t.notes || '-'}</span>
                                                )}
                                            </TableCell>
                                            <TableCell className={cn("text-right font-mono font-medium", t.transaction_type === 'IN' ? "text-green-600" : "text-red-600")}>
                                                {t.transaction_type === 'IN' ? '+' : '-'}{t.quantity} {material.unit}
                                            </TableCell>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(" ");
}
