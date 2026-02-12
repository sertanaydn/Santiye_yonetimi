
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useReactToPrint } from 'react-to-print';
import { PageHeader } from "@/components/layout/page-header";
import Link from 'next/link';
import { List } from 'lucide-react';

export default function RequestPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const printRef = useRef(null);

    const [formData, setFormData] = useState({
        request_date: new Date().toISOString().split('T')[0],
        requester: 'Şantiye Şefi',
        item_name: '',
        quantity: '',
        unit: 'Adet',
        location: '',
        description: '',
        urgency: 'Normal'
    });

    // Approver Titles State
    const [approver1, setApprover1] = useState('YİĞİT PAPAĞAN');
    const [approver2, setApprover2] = useState('KONTROL EDEN');

    const [lastRequest, setLastRequest] = useState<any>(null); // To show print view after save

    // Print Handler
    const handlePrint = useReactToPrint({
        contentRef: printRef,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/sync-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();

            if (result.success) {
                setLastRequest(result.data); // Store for printing
                // Don't redirect immediately, let them print
            } else {
                alert("Hata: " + result.error);
            }
        } catch (err) {
            alert("Hata");
        } finally {
            setLoading(false);
        }
    };

    // If saved successfully, show Print View
    if (lastRequest) {
        return (
            <div className="min-h-screen bg-neutral-100 p-8 flex flex-col items-center gap-6">
                <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center w-full max-w-lg">
                    ✅ Talep Başarıyla Kaydedildi!
                </div>

                {/* Printable Area */}
                <div ref={printRef} className="bg-white p-8 w-[21cm] min-h-[29.7cm] shadow-lg text-black print:shadow-none">
                    <div className="border-b-2 border-black pb-4 mb-8 text-center">
                        <h1 className="text-2xl font-bold">MALZEME SATIN ALMA TALEP FORMU</h1>
                        <p className="text-sm mt-2">Tarih: {lastRequest.request_date}</p>
                    </div>

                    <table className="w-full border-collapse border border-black mb-12">
                        <tbody>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100 w-1/3">Talep Eden (Bölüm)</td>
                                <td className="border border-black p-3">{lastRequest.requester}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">İstenen Malzeme</td>
                                <td className="border border-black p-3 text-lg">{lastRequest.item_name}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Miktar</td>
                                <td className="border border-black p-3 text-lg">{lastRequest.quantity}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Aciliyet Durumu</td>
                                <td className="border border-black p-3 uppercase font-bold">{lastRequest.urgency}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Kullanılacak Mahal</td>
                                <td className="border border-black p-3">{lastRequest.location}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Açıklama</td>
                                <td className="border border-black p-3">{lastRequest.description}</td>
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
                        Bu belge Şantiye Yöneticisi v2.0 Sisteminden Otomatik Oluşturulmuştur. Ref: {lastRequest.id}
                    </div>
                </div>

                <div className="flex gap-4 print:hidden fixed bottom-8">
                    <Button onClick={() => window.print()} className="bg-blue-600 h-14 px-8 text-lg shadow-xl">🖨️ Yazdır</Button>
                    <Button variant="secondary" onClick={() => router.push('/')} className="h-14 px-8 text-lg bg-white shadow-xl">Ana Menüye Dön</Button>
                    <Button variant="outline" onClick={() => { setLastRequest(null); setFormData(prev => ({ ...prev, item_name: '', quantity: '' })) }} className="h-14 px-8 text-lg bg-orange-100 shadow-xl">Yeni Talep</Button>
                </div>
            </div>
        );
    }

    // Normal Form View
    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <PageHeader title="Satın Alma Talebi 🛒" backLink="/">
                <Link href="/talep/list">
                    <Button variant="outline" className="gap-2 bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200">
                        <List className="w-4 h-4" />
                        Talepleri Gör
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center pt-8">
                <Card className="w-full max-w-md shadow-sm border-none sm:border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Yeni Talep Oluştur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="space-y-2">
                                <Label>İstenen Malzeme / Hizmet</Label>
                                <Input placeholder="Örn: 10'luk Çivi, Baret..." value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} required />
                            </div>

                            <div className="space-y-2">
                                <Label>Miktar ve Birim</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Miktar (Örn: 700)"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="flex-1"
                                        required
                                    />
                                    <Select
                                        value={formData.unit}
                                        onValueChange={(val) => setFormData({ ...formData, unit: val })}
                                    >
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Birim" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Adet">Adet</SelectItem>
                                            <SelectItem value="Ton">Ton</SelectItem>
                                            <SelectItem value="Kg">Kg</SelectItem>
                                            <SelectItem value="Metre">Metre</SelectItem>
                                            <SelectItem value="m2">m²</SelectItem>
                                            <SelectItem value="m3">m³</SelectItem>
                                            <SelectItem value="Kutu">Kutu</SelectItem>
                                            <SelectItem value="Paket">Paket</SelectItem>
                                            <SelectItem value="Litre">Litre</SelectItem>
                                            <SelectItem value="Sefer">Sefer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Kullanılacak Mahal</Label>
                                <Input placeholder="Örn: A Blok Giriş..." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Açıklama</Label>
                                <Input placeholder="Varsa ek notlar..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label>Aciliyet</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, urgency: val })} defaultValue="Normal">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Normal">Normal (3-5 Gün)</SelectItem>
                                        <SelectItem value="Acil">Acil (Yarın)</SelectItem>
                                        <SelectItem value="Çok Acil">Çok Acil (Hemen)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Talep Eden</Label>
                                <Input value={formData.requester} onChange={(e) => setFormData({ ...formData, requester: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg" disabled={loading}>
                                {loading ? 'İşleniyor...' : 'Talebi Oluştur'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
