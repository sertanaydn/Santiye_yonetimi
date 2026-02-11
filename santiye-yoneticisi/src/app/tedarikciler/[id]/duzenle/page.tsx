
'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Building2, Mail, Phone, MapPin, User, FileText, Globe, Settings, Upload, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; // Assuming sonner is available based on other files

export default function EditSupplierPage() {
    const router = useRouter();
    const params = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        type: 'taseron',
        name: '',
        email: '',
        phone: '',
        fax: '',
        activities: [] as string[],
        country: 'tr',
        city: '',
        address: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        notes: '',
        is_active: true
    });

    useEffect(() => {
        if (params.id) {
            fetchSupplier(params.id as string);
        }
    }, [params.id]);

    const fetchSupplier = async (id: string) => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
            alert("Firma bilgileri alınamadı.");
            router.push('/tedarikciler');
            return;
        }

        if (data) {
            setFormData({
                type: data.type || 'taseron',
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                fax: data.fax || '',
                activities: data.activities || [],
                country: data.country || 'tr',
                city: data.city || '',
                address: data.address || '',
                contact_name: data.contact_name || '',
                contact_email: data.contact_email || '',
                contact_phone: data.contact_phone || '',
                notes: data.notes || '',
                is_active: data.is_active !== false // Default true
            });
        }
        setFetching(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/suppliers/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (result.success) {
                // Use a simple alert fallback if toast isn't set up globally, 
                // but try to be consistent with valid UI.
                // alert("✅ Firma Başarıyla Güncellendi!");
                router.push(`/tedarikciler/${params.id}`);
            } else {
                alert("Hata: " + result.error);
            }
        } catch (err) {
            alert("Bağlantı Hatası");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-10 text-center text-neutral-500">Yükleniyor...</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Firma Düzenle" subtitle={formData.name} backLink={`/tedarikciler/${params.id}`} />

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6 pb-10">

                    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-neutral-50 px-8 py-6">
                            <h1 className="text-xl font-bold text-neutral-800">Firma Bilgileri Güncelle</h1>
                            <p className="text-sm text-neutral-500 mt-1">Mevcut firma bilgilerini düzenleyin.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">

                            {/* Firma Tipi */}
                            <div className="space-y-3">
                                <Label className="text-neutral-500 font-normal">Firma Tipi</Label>
                                <RadioGroup value={formData.type} className="flex items-center gap-6" onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <div className={`flex items-center space-x-2 border p-3 rounded-md w-40 ${formData.type === 'taseron' ? 'bg-blue-50 border-blue-200' : ''}`}>
                                        <RadioGroupItem value="taseron" id="taseron" className={formData.type === 'taseron' ? "text-blue-600" : ""} />
                                        <Label htmlFor="taseron" className={`font-medium cursor-pointer ${formData.type === 'taseron' ? "text-blue-700" : ""}`}>Taşeron</Label>
                                    </div>
                                    <div className={`flex items-center space-x-2 ${formData.type === 'tedarikci' ? 'bg-blue-50 border-blue-200 border p-3 rounded-md' : 'p-3'}`}>
                                        <RadioGroupItem value="tedarikci" id="tedarikci" className={formData.type === 'tedarikci' ? "text-blue-600" : ""} />
                                        <Label htmlFor="tedarikci" className={`cursor-pointer ${formData.type === 'tedarikci' ? "font-medium text-blue-700" : ""}`}>Tedarikçi</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <Separator />

                            {/* Genel Bilgiler */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-500">Genel Bilgiler</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Building2 className="w-4 h-4" /></span>
                                            <Input placeholder="Firma Adı*" className="pl-10 border-red-200 bg-red-50 focus:bg-white transition-colors" required
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Mail className="w-4 h-4" /></span>
                                            <Input placeholder="Email" className="pl-10" type="email"
                                                value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="relative flex">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Phone className="w-4 h-4" /></span>
                                            <div className="absolute left-10 top-2.5 text-sm font-semibold text-neutral-600 border-r pr-2 h-5 flex items-center">+90</div>
                                            <Input placeholder="5XX XXX XX XX" className="pl-24" type="tel"
                                                value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative flex">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Phone className="w-4 h-4" /></span>
                                            <Input placeholder="Fax" className="pl-10"
                                                value={formData.fax} onChange={(e) => setFormData({ ...formData, fax: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <Select>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Ticari Faaliyetler (Örn: Elektrik, Mekanik...)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="elektrik">Elektrik</SelectItem>
                                                <SelectItem value="mekanik">Mekanik</SelectItem>
                                                <SelectItem value="insaat">İnşaat</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Adres Bilgileri */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-500">Adres Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Globe className="w-4 h-4" /></span>
                                            <Select value={formData.country} onValueChange={(val) => setFormData({ ...formData, country: val })}>
                                                <SelectTrigger className="pl-10">
                                                    <SelectValue placeholder="Ülke Seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tr">Türkiye</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><MapPin className="w-4 h-4" /></span>
                                            <Select value={formData.city} onValueChange={(val) => setFormData({ ...formData, city: val })}>
                                                <SelectTrigger className="pl-10">
                                                    <SelectValue placeholder="Şehir Seçiniz" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="İstanbul">İstanbul</SelectItem>
                                                    <SelectItem value="Ankara">Ankara</SelectItem>
                                                    <SelectItem value="İzmir">İzmir</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Textarea placeholder="Adres" className="min-h-[80px]"
                                            value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Yetkili Kişi */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-500">Yetkili Kişi Bilgileri</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><User className="w-4 h-4" /></span>
                                            <Input placeholder="Yetkili Kişi" className="pl-10"
                                                value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Mail className="w-4 h-4" /></span>
                                            <Input placeholder="Yetkili Kişi Email" className="pl-10" type="email"
                                                value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><Phone className="w-4 h-4" /></span>
                                            <Input placeholder="Yetkili Kişi Tel (Opsiyonel)" className="pl-10" type="tel"
                                                value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-neutral-400"><FileText className="w-4 h-4" /></span>
                                            <Input placeholder="Notlar" className="pl-10"
                                                value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Ek Bilgiler */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-neutral-500">Ek Bilgiler</h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
                                        <div className="p-2 bg-neutral-100 rounded">
                                            <Settings className="w-5 h-5 text-neutral-500" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">Aktif Kullanım</div>
                                            <div className="text-xs text-neutral-400">Bu firmayı bütün projelerde aktif kullan.</div>
                                        </div>
                                        <Switch checked={formData.is_active} onCheckedChange={(val) => setFormData({ ...formData, is_active: val })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    İptal
                                </Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 min-w-[120px]" disabled={loading}>
                                    {loading ? 'Kaydediliyor...' : 'Güncelle'}
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
