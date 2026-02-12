'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Trash2, CheckCircle, Clock, AlertTriangle, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useRef } from 'react';

export default function PurchaseRequestListPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('purchase_requests')
                .select('*')
                .order('request_date', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
            toast.error('Talepler yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('purchase_requests')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Durum güncellendi: ${newStatus}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Durum güncellenemedi.');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('purchase_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Talep silindi.');
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting request:', error);
            toast.error('Talep silinemedi.');
        }
    };

    const getUrgencyBadge = (urgency: string) => {
        switch (urgency) {
            case 'Çok Acil':
                return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">🔴 Çok Acil</Badge>;
            case 'Acil':
                return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">🟠 Acil</Badge>;
            default:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">🟢 Normal</Badge>;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Onaylandı':
                return <Badge className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Onaylandı</Badge>;
            case 'Reddedildi':
                return <Badge variant="destructive">Reddedildi</Badge>;
            case 'Bekliyor':
            default:
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Bekliyor</Badge>;
        }
    };

    const printRef = useRef(null);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    const triggerPrint = (request: any) => {
        setSelectedRequest(request);
        // Wait for state to update then print
        setTimeout(() => {
            handlePrint();
        }, 100);
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <PageHeader title="Gelen Sipariş Talepleri 📦" backLink="/talep" />

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                <Card className="max-w-6xl mx-auto border-neutral-200 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-neutral-50">
                            <TableRow>
                                <TableHead className="w-[120px]">Tarih</TableHead>
                                <TableHead className="w-[150px]">Talep Eden</TableHead>
                                <TableHead className="min-w-[200px]">Malzeme / Hizmet</TableHead>
                                <TableHead className="w-[120px]">Miktar</TableHead>
                                <TableHead className="w-[140px]">Aciliyet</TableHead>
                                <TableHead className="w-[140px]">Durum</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                        Yükleniyor...
                                    </TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-neutral-500">
                                        Henüz talep bulunmuyor.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((request) => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-medium text-neutral-600">
                                            {new Date(request.request_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell>{request.requester}</TableCell>
                                        <TableCell className="font-medium text-black text-base">{request.item_name}</TableCell>
                                        <TableCell>
                                            <span className="font-bold text-neutral-800">{request.quantity}</span>
                                            <span className="text-neutral-500 ml-1 text-sm">{request.unit}</span>
                                        </TableCell>
                                        <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                    onClick={() => triggerPrint(request)}
                                                    title="Yazdır"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </Button>

                                                {request.status !== 'Onaylandı' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                                        onClick={() => handleUpdateStatus(request.id, 'Onaylandı')}
                                                    >
                                                        Onayla
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(request.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Hidden Print Area */}
            <div className="hidden">
                {selectedRequest && (
                    <div ref={printRef} className="bg-white p-8 w-[21cm] min-h-[29.7cm] text-black">
                        <div className="border-b-2 border-black pb-4 mb-8 text-center">
                            <h1 className="text-2xl font-bold">MALZEME SATIN ALMA TALEP FORMU</h1>
                            <p className="text-sm mt-2">Tarih: {selectedRequest.request_date}</p>
                        </div>

                        <table className="w-full border-collapse border border-black mb-12">
                            <tbody>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100 w-1/3">Talep Eden (Bölüm)</td>
                                    <td className="border border-black p-3">{selectedRequest.requester}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100">İstenen Malzeme</td>
                                    <td className="border border-black p-3 text-lg">{selectedRequest.item_name}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100">Miktar</td>
                                    <td className="border border-black p-3 text-lg">{selectedRequest.quantity} {selectedRequest.unit}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100">Aciliyet Durumu</td>
                                    <td className="border border-black p-3 uppercase font-bold">{selectedRequest.urgency}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100">Kullanılacak Mahal</td>
                                    <td className="border border-black p-3">{selectedRequest.location}</td>
                                </tr>
                                <tr>
                                    <td className="border border-black p-3 font-bold bg-gray-100">Açıklama</td>
                                    <td className="border border-black p-3">{selectedRequest.description}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="flex justify-between mt-20 px-8 text-center">
                            <div className="flex flex-col items-center">
                                <p className="font-bold border-t border-black pt-2 w-48 mx-auto">TALEP EDEN</p>
                                <p className="mt-2 font-semibold">YİĞİT PAPAĞAN</p>
                                <p className="mt-6 text-gray-400">(İmza)</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <p className="font-bold border-t border-black pt-2 w-48 mx-auto">KONTROL EDEN</p>
                                <p className="mt-2 font-semibold">TOLGA SÜZEN</p>
                                <p className="mt-6 text-gray-400">(İmza)</p>
                            </div>
                        </div>

                        <div className="absolute bottom-8 left-0 w-full text-center text-xs text-gray-400">
                            Ref: {selectedRequest.id}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
