
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/layout/page-header";

const CONCRETE_CLASSES = ["C25", "C30", "C35", "C40"];
const CASTING_TYPES = ["Pompalı", "Mikser (Transmikser)", "Kovalı"];

export default function ConcretePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: 'Öztop', // Default or Select
        concrete_class: '',
        casting_type: 'Pompalı',
        location_block: '',
        location_floor: '',
        quantity: '',
        slump: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/sync-concrete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (result.success) {
                alert("✅ Beton dökümü kaydedildi!");
                router.push('/');
            } else {
                alert("Hata: " + result.error);
            }
        } catch (err) {
            alert("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50">
            <PageHeader title="Beton Döküm Takip" backLink="/" />

            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center pt-8">
                <Card className="w-full max-w-md shadow-sm border-none sm:border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Beton Dökümü Kaydet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tarih</Label>
                                    <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Blok</Label>
                                    <Input placeholder="Örn: A Blok" value={formData.location_block} onChange={(e) => setFormData({ ...formData, location_block: e.target.value })} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Kat / Bölge</Label>
                                <Input placeholder="Örn: 1. Kat Kolonlar" value={formData.location_floor} onChange={(e) => setFormData({ ...formData, location_floor: e.target.value })} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Beton Sınıfı</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, concrete_class: val })} required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seç" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONCRETE_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Döküm Tipi</Label>
                                    <Select onValueChange={(val) => setFormData({ ...formData, casting_type: val })} defaultValue="Pompalı">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seç" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CASTING_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Miktar (m³)</Label>
                                    <Input type="number" step="0.5" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slump (cm)</Label>
                                    <Input type="number" placeholder="16" value={formData.slump} onChange={(e) => setFormData({ ...formData, slump: e.target.value })} />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-lg" disabled={loading}>
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
