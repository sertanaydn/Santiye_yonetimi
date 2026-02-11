
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Package, TrendingUp } from "lucide-react";

export default function NewMaterialPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        code: '', // Manual or Auto? Let's make it manual for now as per screenshot
        name: '',
        unit: '',
        category: '',
        brand: '',
        model: '',
        description: '',
        min_stock_limit: 0,
        current_stock: 0,
        is_active: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.unit) {
                toast.error("Lütfen zorunlu alanları (Ad, Birim) doldurun.");
                setLoading(false);
                return;
            }

            const res = await fetch('/api/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.error) throw new Error(data.error);

            toast.success("Malzeme başarıyla oluşturuldu.");
            router.push('/malzemeler');

        } catch (error: any) {
            toast.error(error.message || "Bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Yeni Malzeme Ekle">
                <Button variant="outline" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Geri Dön
                </Button>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

                    {/* General Info */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="bg-neutral-50/50 border-b pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-neutral-700">
                                <Package className="w-4 h-4 text-blue-500" />
                                Genel Bilgiler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-xs font-semibold text-neutral-500 uppercase">Malzeme Kodu</Label>
                                <Input
                                    id="code" name="code"
                                    placeholder="Örn: STK-0001"
                                    value={formData.code} onChange={handleChange}
                                    className="bg-neutral-50"
                                />
                                <p className="text-[10px] text-neutral-400">Boş bırakırsanız otomatik üretilir (henüz aktif değil, manuel giriniz).</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold text-neutral-500 uppercase">Malzeme Adı <span className="text-red-500">*</span></Label>
                                <Input
                                    id="name" name="name"
                                    placeholder="Örn: 14'lük Nervürlü Demir"
                                    value={formData.name} onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase">Birim <span className="text-red-500">*</span></Label>
                                <Select onValueChange={(val) => handleSelectChange('unit', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Adet">Adet</SelectItem>
                                        <SelectItem value="Kg">Kg</SelectItem>
                                        <SelectItem value="M3">M³ (Metreküp)</SelectItem>
                                        <SelectItem value="Ton">Ton</SelectItem>
                                        <SelectItem value="Litre">Litre</SelectItem>
                                        <SelectItem value="Metre">Metre</SelectItem>
                                        <SelectItem value="M2">M² (Metrekare)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-neutral-500 uppercase">Kategori</Label>
                                <Select onValueChange={(val) => handleSelectChange('category', val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kategori Seç..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="İnşaat">İnşaat</SelectItem>
                                        <SelectItem value="Hırdavat">Hırdavat</SelectItem>
                                        <SelectItem value="Elektrik">Elektrik</SelectItem>
                                        <SelectItem value="Mekanik">Mekanik</SelectItem>
                                        <SelectItem value="Boya">Boya</SelectItem>
                                        <SelectItem value="Diğer">Diğer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="brand" className="text-xs font-semibold text-neutral-500 uppercase">Marka</Label>
                                <Input id="brand" name="brand" placeholder="Marka giriniz" value={formData.brand} onChange={handleChange} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="model" className="text-xs font-semibold text-neutral-500 uppercase">Model / Çeşit</Label>
                                <Input id="model" name="model" placeholder="Model giriniz" value={formData.model} onChange={handleChange} />
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <Label htmlFor="description" className="text-xs font-semibold text-neutral-500 uppercase">Açıklama</Label>
                                <Textarea
                                    id="description" name="description"
                                    placeholder="Ürün hakkında detaylı bilgi..."
                                    className="min-h-[80px]"
                                    value={formData.description} onChange={handleChange}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Stock Settings */}
                    <Card className="border-neutral-200 shadow-sm">
                        <CardHeader className="bg-neutral-50/50 border-b pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-neutral-700">
                                <TrendingUp className="w-4 h-4 text-orange-500" />
                                Stok Ayarları
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="current_stock" className="text-xs font-semibold text-neutral-500 uppercase">Başlangıç Stok Miktarı</Label>
                                <Input
                                    id="current_stock" name="current_stock" type="number" step="0.01"
                                    value={formData.current_stock} onChange={handleChange}
                                    className="bg-orange-50/50 border-orange-200 focus:ring-orange-200"
                                />
                                <p className="text-[10px] text-neutral-400">Şantiyede şu an mevcut olan miktar.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="min_stock_limit" className="text-xs font-semibold text-neutral-500 uppercase">Kritik Stok Uyarısı</Label>
                                <Input
                                    id="min_stock_limit" name="min_stock_limit" type="number" step="0.01"
                                    value={formData.min_stock_limit} onChange={handleChange}
                                />
                                <p className="text-[10px] text-neutral-400">Stok bu sınırın altına düşerse uyarı verilir.</p>
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => router.back()}>İptal</Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Kaydediliyor</> : <><Save className="w-4 h-4 mr-2" /> Kaydet</>}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
