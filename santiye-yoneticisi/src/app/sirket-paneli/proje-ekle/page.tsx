
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Calendar, Image as ImageIcon, MapPin, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default function AddProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        start_date: '',
        end_date: '',
        independent_section_count: '',
        construction_area_m2: '',
        status: 'ongoing',
        tracking_type: 'general',
        settings: {
            subcontractors: false,
            stock: false,
            flow: false
        },
        country: '',
        city: ''
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (result.success) {
                alert("✅ Proje Başarıyla Oluşturuldu!");
                router.push('/sirket-paneli');
            } else {
                alert("Hata: " + result.error);
            }
        } catch (error) {
            alert("Sunucu hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Yeni Proje Ekle" backLink="/sirket-paneli" />

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-8 space-y-8">

                    {/* Project Image Placeholder */}
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition cursor-pointer">
                        <ImageIcon className="w-12 h-12 text-neutral-300 mb-2" />
                        <div className="text-sm font-medium text-neutral-600">Proje resmini buradan</div>
                        <div className="text-xs text-neutral-400">yükleyebilirsiniz</div>
                    </div>

                    {/* Proje Bilgileri */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Proje Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Proje Adı *</Label>
                                <Input
                                    placeholder="Proje Adı" className="font-medium"
                                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Proje Tipi Seçiniz *</Label>
                                <Select onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="konut">Konut</SelectItem>
                                        <SelectItem value="ticari">Ticari</SelectItem>
                                        <SelectItem value="endustriyel">Endüstriyel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Başlama Tarihi *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input type="date" className="pl-10"
                                        value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Planlanan Bitiş Tarihi *</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input type="date" className="pl-10"
                                        value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Bağımsız Bölüm Sayısı</Label>
                                <Input placeholder="0" type="number"
                                    value={formData.independent_section_count} onChange={(e) => setFormData({ ...formData, independent_section_count: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-neutral-500">Toplam İnşaat Alanı</Label>
                                <div className="relative">
                                    <Input placeholder="0" type="number" className="pr-10"
                                        value={formData.construction_area_m2} onChange={(e) => setFormData({ ...formData, construction_area_m2: e.target.value })}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-medium">m2</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Detaylı Bilgi (Durum & Takip Tipi) */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Detaylı Bilgi</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Durum Switch */}
                            <div className="border rounded-md p-4">
                                <Label className="text-xs text-neutral-500 block mb-3">Durum</Label>
                                <div className="flex items-center gap-4 cursor-pointer">
                                    <div
                                        className={cn("flex items-center gap-2 p-2 rounded", formData.status === 'completed' && "bg-neutral-100")}
                                        onClick={() => setFormData({ ...formData, status: 'completed' })}
                                    >
                                        <div className={cn("w-4 h-4 rounded-full border-2", formData.status === 'completed' ? "border-green-500 bg-green-500" : "border-neutral-300")}></div>
                                        <span className="text-sm text-neutral-600">Tamamlandı</span>
                                    </div>
                                    <div
                                        className={cn("flex items-center gap-2 p-2 rounded", formData.status === 'ongoing' && "bg-blue-50")}
                                        onClick={() => setFormData({ ...formData, status: 'ongoing' })}
                                    >
                                        <div className={cn("w-4 h-4 rounded-full border-2", formData.status === 'ongoing' ? "border-blue-500 bg-blue-500" : "border-neutral-300")}></div>
                                        <span className="text-sm font-medium text-blue-600">Devam Ediyor</span>
                                    </div>
                                </div>
                            </div>

                            {/* Genel İlerleme Oranı */}
                            <div className="border rounded-md p-4">
                                <Label className="text-xs text-neutral-500 block mb-2">Genel İlerleme Oranı Kilidi</Label>
                                <div className="flex items-center gap-3">
                                    <Input type="number" defaultValue="0" className="w-20 text-center" />
                                    <span className="text-neutral-500">%</span>
                                </div>
                                <p className="text-[10px] text-neutral-400 mt-2">
                                    Bu anahtarın tamamlanmasıyla birlikte sistem, ilerleme oranının % kaçını tamamlanmış olarak görsün?
                                </p>
                            </div>
                        </div>

                        {/* Takip Tipi Radio Cards */}
                        <div className="space-y-3">
                            <Label className="text-xs text-neutral-500">Takip Tipi</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    onClick={() => setFormData({ ...formData, tracking_type: 'general' })}
                                    className={cn("border rounded-lg p-4 cursor-pointer relative", formData.tracking_type === 'general' ? "border-blue-500 bg-blue-50" : "hover:bg-neutral-50 opacity-60")}
                                >
                                    {formData.tracking_type === 'general' && <div className="absolute top-4 right-4 text-blue-600">●</div>}
                                    <h4 className="text-sm font-semibold text-blue-700 mb-1">Genel Durum Takibi</h4>
                                    <p className="text-[10px] text-blue-600/80 leading-tight">
                                        Proje takibini sağlayacağınız daire, ofis, kat, blok, bağımsız bölüm vb. için kontrol listesi şablonları oluşturun.
                                    </p>
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, tracking_type: 'quantity' })}
                                    className={cn("border rounded-lg p-4 cursor-pointer relative", formData.tracking_type === 'quantity' ? "border-blue-500 bg-blue-50" : "hover:bg-neutral-50 opacity-60")}
                                >
                                    {formData.tracking_type === 'quantity' && <div className="absolute top-4 right-4 text-blue-600">●</div>}
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-1">Metraj Takibi</h4>
                                    <p className="text-[10px] text-neutral-500 leading-tight">
                                        İş kalemlerinin gerçekleşen metraj değerlerini girerek takip edin.
                                    </p>
                                </div>
                                <div
                                    onClick={() => setFormData({ ...formData, tracking_type: 'man_hour' })}
                                    className={cn("border rounded-lg p-4 cursor-pointer relative", formData.tracking_type === 'man_hour' ? "border-blue-500 bg-blue-50" : "hover:bg-neutral-50 opacity-60")}
                                >
                                    {formData.tracking_type === 'man_hour' && <div className="absolute top-4 right-4 text-blue-600">●</div>}
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-1">Adam x Saat</h4>
                                    <p className="text-[10px] text-neutral-500 leading-tight">
                                        İş kalemlerinin gerçekleşen adam x saat değerlerini girerek takip edin.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Varsayılan Ayarlar (Toggles) */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Varsayılan Ayarlar</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3">
                                <Switch checked={formData.settings.subcontractors} onCheckedChange={(val) => setFormData({ ...formData, settings: { ...formData.settings, subcontractors: val } })} />
                                <div>
                                    <div className="text-sm font-medium">Taşeronlar</div>
                                    <div className="text-[10px] text-neutral-400">Proje bazlı taşeron yönetimi açılsın mı?</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Switch checked={formData.settings.stock} onCheckedChange={(val) => setFormData({ ...formData, settings: { ...formData.settings, stock: val } })} />
                                <div>
                                    <div className="text-sm font-medium">Proje Bazlı Stok</div>
                                    <div className="text-[10px] text-neutral-400">Proje için ayrı stok yönetimi yapılsın mı?</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Switch checked={formData.settings.flow} onCheckedChange={(val) => setFormData({ ...formData, settings: { ...formData.settings, flow: val } })} />
                                <div>
                                    <div className="text-sm font-medium">Akış</div>
                                    <div className="text-[10px] text-neutral-400">Akış olarak kullanımı başlatılsın.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Adres Bilgileri (Map Placeholder) */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">Adres Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Select onValueChange={(val) => setFormData({ ...formData, country: val })}>
                                    <SelectTrigger><SelectValue placeholder="Ülke Seçiniz *" /></SelectTrigger>
                                    <SelectContent><SelectItem value="tr">Türkiye</SelectItem></SelectContent>
                                </Select>
                                <Select onValueChange={(val) => setFormData({ ...formData, city: val })}>
                                    <SelectTrigger><SelectValue placeholder="Şehir Seçiniz *" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="istanbul">İstanbul</SelectItem>
                                        <SelectItem value="bursa">Bursa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="h-40 bg-neutral-100 rounded-lg flex items-center justify-center border">
                                <div className="text-center text-neutral-400">
                                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-xs">Harita Görünümü</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-6">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 min-w-[150px]" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
