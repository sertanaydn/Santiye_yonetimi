'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '@/lib/supabase';
import { CameraInput } from "@/components/camera-input";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { toast } from 'sonner';
import { Plus, Trash2, Save, ArrowLeft, History } from 'lucide-react';

// --- Static Lists ---

const SUPPLIERS = [
    "Öztop", "Shn", "Canbek", "Mini Kepçe", "Ceper", "Artı Yedi", "Barış Vinç", "Diğer"
];

const COMPANIES = [
    "Camsan", "Koparan", "Camsan&Koparan", "Altın Raket"
];

const LOCATIONS = [
    "A-Blok", "B-Blok", "C-Blok", "D-Blok", "E-Blok", "Şantiye",
    "A-B. Blok", "B-E Blok", "Satış Ofisi", "E-C Blok",
    "A-B-E Blok", "B-C Blok", "C-D Blok", "A-B-D Blok"
];

interface WaybillItem {
    id: string;
    material_id: string;
    quantity: string;
    unit: string;
    location: string;
    notes: string;
}

export default function WaybillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [materials, setMaterials] = useState<any[]>([]);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    // Header State
    const [header, setHeader] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: '',
        company: '',
        waybill_no: ''
    });

    // Items State
    const [items, setItems] = useState<WaybillItem[]>([
        { id: '1', material_id: '', quantity: '', unit: 'Adet', location: '', notes: '' }
    ]);

    // Fetch Materials
    useEffect(() => {
        async function fetchMaterials() {
            const { data } = await supabase.from('materials').select('*').order('category', { ascending: true });
            if (data) setMaterials(data);
        }
        fetchMaterials();
    }, []);

    // Group Materials
    const groupedMaterials = materials.reduce((acc, item) => {
        const cat = item.category || 'Diğer';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const addItem = () => {
        setItems([
            ...items,
            { id: Math.random().toString(36).substr(2, 9), material_id: '', quantity: '', unit: 'Adet', location: '', notes: '' }
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        } else {
            toast.error("En az bir satır olmalıdır.");
        }
    };

    const updateItem = (id: string, field: keyof WaybillItem, value: string) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updates: any = { [field]: value };
                // Auto-set unit if material changes
                if (field === 'material_id') {
                    const selected = materials.find(m => m.id === value);
                    if (selected) updates.unit = selected.unit || 'Adet';
                }
                return { ...item, ...updates };
            }
            return item;
        }));
    };

    const uploadPhoto = async (file: File) => {
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        const { data, error } = await supabase.storage
            .from('waybill-photos')
            .upload(filename, file);

        if (error) {
            console.error("Upload error:", error);
            if (error.message.includes("bucket not found")) {
                toast.error("HATA: Supabase'de 'waybill-photos' klasörü yok!");
            }
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('waybill-photos')
            .getPublicUrl(filename);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validations
            if (!header.date || !header.supplier || !header.company) {
                toast.error("Lütfen tarih, firma ve tedarikçi seçiniz.");
                setLoading(false);
                return;
            }

            const validItems = items.filter(i => i.material_id && i.quantity);
            if (validItems.length === 0) {
                toast.error("Lütfen en az bir malzeme ve miktar giriniz.");
                setLoading(false);
                return;
            }

            let finalPhotoUrl = '';
            if (photoFile) {
                const url = await uploadPhoto(photoFile);
                if (url) finalPhotoUrl = url;
            }

            const payload = {
                ...header,
                photo_url: finalPhotoUrl,
                created_by: 'user@demo.com',
                items: validItems.map(item => {
                    const mat = materials.find(m => m.id === item.material_id);
                    return {
                        ...item,
                        material_name: mat ? mat.name : 'Bilinmeyen'
                    };
                })
            };

            const res = await fetch('/api/sync-waybill', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.success) {
                const count = result.count || validItems.length;
                toast.success(`✅ ${count} kalem kaydedildi ve Excel'e işlendi.`);
                router.push('/irsaliye/list');
            } else {
                toast.error("Hata: " + result.error);
            }
        } catch (err) {
            console.error(err);
            toast.error("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Yeni İrsaliye Girişi" backLink="/">
                <Link href="/irsaliye/list">
                    <Button variant="outline" size="sm" className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20">
                        <History className="w-4 h-4" />
                        Geçmiş
                    </Button>
                </Link>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

                    {/* Header Card */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-4 border-b bg-neutral-50/50">
                            <CardTitle className="text-base font-semibold text-neutral-700">İrsaliye Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500 uppercase">Tarih</Label>
                                <Input
                                    type="date"
                                    value={header.date}
                                    onChange={(e) => setHeader({ ...header, date: e.target.value })}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500 uppercase">İrsaliye No</Label>
                                <Input
                                    placeholder="İrsaliye No Giriniz"
                                    value={header.waybill_no}
                                    onChange={(e) => setHeader({ ...header, waybill_no: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500 uppercase">Firma (Kime)</Label>
                                <Select value={header.company} onValueChange={(val) => setHeader({ ...header, company: val })} required>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Firma Seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMPANIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-neutral-500 uppercase">Tedarikçi</Label>
                                <Select value={header.supplier} onValueChange={(val) => setHeader({ ...header, supplier: val })} required>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Tedarikçi Seç" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SUPPLIERS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items Card */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="pb-4 border-b bg-neutral-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-semibold text-neutral-700">Malzemeler</CardTitle>
                            <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-2 bg-white text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Plus className="w-4 h-4" />
                                Satır Ekle
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {items.map((item, index) => (
                                <div key={item.id} className="relative p-4 bg-neutral-50 rounded-xl border border-neutral-200 shadow-sm group transition-all hover:border-blue-300">
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {/* Material: Full Width on Mobile, 4 cols on Desktop */}
                                        <div className="md:col-span-12 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-neutral-400 uppercase">Malzeme / İş Kalemi</Label>
                                            <Select value={item.material_id} onValueChange={(val) => updateItem(item.id, 'material_id', val)}>
                                                <SelectTrigger className="bg-white border-blue-100 hover:border-blue-300 transition-colors">
                                                    <SelectValue placeholder="Malzeme Seçiniz..." />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-[300px]">
                                                    {Object.keys(groupedMaterials).map((category) => (
                                                        <SelectGroup key={category}>
                                                            <SelectLabel className="bg-neutral-100 text-neutral-500 font-bold px-2 py-1 sticky top-0">{category}</SelectLabel>
                                                            {groupedMaterials[category].map(m => (
                                                                <SelectItem key={m.id} value={m.id}>
                                                                    {m.name} <span className="text-neutral-400 text-xs">({m.unit})</span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Row 2: Quantity, Unit, Location */}
                                        <div className="md:col-span-4 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-neutral-400 uppercase">Miktar</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                                className="bg-white font-mono font-bold text-lg"
                                            />
                                        </div>

                                        <div className="md:col-span-2 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-neutral-400 uppercase">Birim</Label>
                                            <Select value={item.unit} onValueChange={(val) => updateItem(item.id, 'unit', val)}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Adet">Adet</SelectItem>
                                                    <SelectItem value="Kg">Kg</SelectItem>
                                                    <SelectItem value="Ton">Ton</SelectItem>
                                                    <SelectItem value="M3">M3</SelectItem>
                                                    <SelectItem value="M2">M2</SelectItem>
                                                    <SelectItem value="Mt">Mt</SelectItem>
                                                    <SelectItem value="Paket">Paket</SelectItem>
                                                    <SelectItem value="Kutu">Kutu</SelectItem>
                                                    <SelectItem value="Torba">Torba</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-6 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-neutral-400 uppercase">Mahal / Blok</Label>
                                            <Select value={item.location} onValueChange={(val) => updateItem(item.id, 'location', val)}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Row 3: Notes */}
                                        <div className="md:col-span-12 space-y-1.5">
                                            <Label className="text-[10px] font-bold text-neutral-400 uppercase">Detay / Açıklama</Label>
                                            <Input
                                                placeholder="Not ekle..."
                                                value={item.notes}
                                                onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                                                className="bg-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <Button type="button" variant="outline" onClick={addItem} className="w-full border-dashed border-neutral-300 text-neutral-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 h-12">
                                <Plus className="w-4 h-4 mr-2" />
                                Yeni Satır Ekle
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Photo & Submit */}
                    <Card className="border-neutral-200 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="p-6">
                                <Label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">İrsaliye Fotoğrafı</Label>
                                <CameraInput onPhotoTaken={setPhotoFile} />
                            </div>
                            <div className="p-4 bg-neutral-50 border-t flex items-center justify-end">
                                <Button type="submit" disabled={loading} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md h-12 px-8 text-lg font-semibold">
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Yükleniyor...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Save className="w-5 h-5" />
                                            <span>İrsaliyeyi Kaydet</span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </form>
            </div>
        </div>
    );
}
