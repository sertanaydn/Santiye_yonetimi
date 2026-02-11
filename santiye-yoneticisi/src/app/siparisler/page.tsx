'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Eye, Printer, Plus, Search, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_orders')
                .select('*')
                .order('order_date', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (orderId: string, orderNumber: string) => {
        if (!confirm(`${orderNumber} numaralı siparişi silmek istediğinizden emin misiniz?`)) return;

        try {
            const { error } = await supabase
                .from('purchase_orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            toast.success('Sipariş silindi');
            fetchOrders(); // Refresh list
        } catch (error: any) {
            console.error(error);
            toast.error('Silme hatası: ' + error.message);
        }
    };

    const filteredOrders = orders.filter(order =>
        (order.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.order_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader
                title="Siparişler"
                subtitle="Tedarikçi siparişlerini yönetin."
            >
                <Link href="/fiyat-karsilastirma/karar-formu">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Sipariş Oluştur
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
                {/* Filters */}
                <div className="flex gap-4 bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Sipariş No veya Firma Ara..."
                            className="pl-9 bg-neutral-50 border-neutral-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <Card className="flex-1 overflow-auto border-neutral-200 shadow-sm rounded-lg">
                    <Table>
                        <TableHeader className="bg-neutral-50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead>SİPARİŞ NO</TableHead>
                                <TableHead>TARİH</TableHead>
                                <TableHead>TEDARİKÇİ</TableHead>
                                <TableHead>DURUM</TableHead>
                                <TableHead className="text-right">TUTAR</TableHead>
                                <TableHead className="text-right">İŞLEMLER</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Henüz sipariş bulunmuyor.
                                    </TableCell>
                                </TableRow>
                            ) : filteredOrders.map((order) => (
                                <TableRow key={order.id} className="hover:bg-neutral-50">
                                    <TableCell className="font-mono font-medium">
                                        PO-{new Date(order.order_date).getFullYear()}-{order.id.slice(0, 4).toUpperCase()}
                                    </TableCell>
                                    <TableCell>{new Date(order.order_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="font-medium">{order.supplier_name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {order.status || 'Draft'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-bold">
                                        {Number(order.grand_total).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </TableCell>
                                    <TableCell className="text-right p-2">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/siparisler/${order.id}`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-neutral-500 hover:text-blue-600">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-neutral-500 hover:text-red-600"
                                                onClick={() => handleDelete(
                                                    order.id,
                                                    `PO-${new Date(order.order_date).getFullYear()}-${order.id.slice(0, 4).toUpperCase()}`
                                                )}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
