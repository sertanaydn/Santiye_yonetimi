
'use client';


import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, Building2, Briefcase, FileText, Calendar, CheckSquare, MapPin, ChevronDown, ChevronUp, Info, LayoutGrid, FilePlus, List } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AddPersonnelPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);

    const [loading, setLoading] = useState(false);
    const [showExtraInfo, setShowExtraInfo] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        company: '',
        team: '',
        tc_no: '',
        is_active: true,
        is_company_official: false,
        permissions: {},
        // New Fields
        birth_place: '',
        birth_date: '',
        gender: '',
        start_date: '',
        iban: '',
        sgk_no: '',
        marital_status: '',
        child_count: 0,
        blood_type: '',
        mother_name: '',
        father_name: '',
        registry_place: '',
        education_status: '',
        military_status: '',
        reference_person: '',
        approval_person: '',
        country: '',
        city: '',
        address: '',
        project_permissions: {},
        document_template: '' // 'saved' | 'new'
    });

    // UI State for Step 3
    const [selectedProject, setSelectedProject] = useState<string>("");

    const steps = [
        { id: 1, title: 'Kullanıcı Bilgileri', icon: User },
        ...(formData.is_active ? [
            { id: 2, title: 'Şirket Yetkileri', icon: Building2 },
            { id: 3, title: 'Proje Yetkileri', icon: Briefcase },
        ] : []),
        { id: 4, title: 'Doküman', icon: FileText },
    ];

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/personnel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await res.json();
            if (result.success) {
                alert("✅ Kullanıcı Başarıyla Eklendi!");
                router.push('/personeller');
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
            <PageHeader title="Yeni Kullanıcı Ekle" backLink="/personeller" />

            <div className="flex flex-1 overflow-hidden">
                {/* Left Steps Sidebar */}
                <div className="w-64 bg-white border-r p-6 space-y-6 hidden md:block">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={cn(
                                "flex items-center gap-3 p-2 rounded cursor-pointer transition-colors",
                                step === s.id ? "text-neutral-800 font-semibold" : "text-neutral-400"
                            )}
                            onClick={() => setStep(s.id)}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                                step === s.id ? "bg-neutral-800 text-white border-neutral-800" : "bg-white border-neutral-300"
                            )}>
                                {s.id}
                            </div>
                            <span className="text-sm">{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* Main Form Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-4xl mx-auto bg-white rounded-lg border shadow-sm p-8 min-h-[600px]">

                            {/* STEP 1: Kullanıcı Bilgileri */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <section>
                                        <h3 className="text-sm font-semibold text-neutral-500 mb-4">Durum</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div
                                                className={cn("border p-4 rounded-lg flex items-start gap-3 cursor-pointer relative", formData.is_active ? "border-blue-200 bg-blue-50" : "border-neutral-200 opacity-60")}
                                                onClick={() => setFormData({ ...formData, is_active: true })}
                                            >
                                                <div className={cn("w-4 h-4 mt-1 rounded-full border-2", formData.is_active ? "border-blue-500 bg-white" : "border-neutral-300")}></div>
                                                <div>
                                                    <div className="text-sm font-semibold text-neutral-800">Aktif Kullanıcı</div>
                                                    <p className="text-xs text-neutral-500">Sisteme Email adresi ile giriş yapabilen kullanıcıdır.</p>
                                                </div>
                                                {formData.is_active && <CheckSquare className="absolute top-4 right-4 w-4 h-4 text-blue-500" />}
                                            </div>
                                            <div
                                                className={cn("border p-4 rounded-lg flex items-start gap-3 cursor-pointer relative", !formData.is_active ? "border-blue-200 bg-blue-50" : "border-neutral-200 opacity-60")}
                                                onClick={() => setFormData({ ...formData, is_active: false })}
                                            >
                                                <div className={cn("w-4 h-4 mt-1 rounded-full border-2", !formData.is_active ? "border-blue-500 bg-white" : "border-neutral-300")}></div>
                                                <div>
                                                    <div className="text-sm font-semibold text-neutral-800">Pasif Kullanıcı</div>
                                                    <p className="text-xs text-neutral-500">Sisteme giriş yapamaz.</p>
                                                </div>
                                                {!formData.is_active && <CheckSquare className="absolute top-4 right-4 w-4 h-4 text-blue-500" />}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-sm font-semibold text-neutral-500">Temel Bilgiler</h3>

                                        <div className="space-y-2">
                                            <Label className="text-xs text-neutral-500">Ad Soyad *</Label>
                                            <Input
                                                placeholder="Ad Soyad Giriniz"
                                                value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">Email {formData.is_active && "*"}</Label>
                                                <Input
                                                    placeholder={formData.is_active ? "email@ornek.com" : "Opsiyonel"}
                                                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">Telefon</Label>
                                                <div className="flex">
                                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+90</span>
                                                    <Input
                                                        className="rounded-l-none"
                                                        value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">Firma Seçiniz</Label>
                                                <Select onValueChange={(val) => setFormData({ ...formData, company: val })}>
                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                    <SelectContent><SelectItem value="xyz">XYZ Firma</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center pt-8">
                                                <Checkbox
                                                    id="firma-yetkilisi"
                                                    checked={formData.is_company_official}
                                                    onCheckedChange={(val) => setFormData({ ...formData, is_company_official: val === true })}
                                                />
                                                <label htmlFor="firma-yetkilisi" className="text-sm ml-2 text-neutral-600">Firma Yetkilisi</label>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">İş Ünvanı Seçiniz</Label>
                                                <Select onValueChange={(val) => setFormData({ ...formData, role: val })}>
                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="muhendis">Mühendis</SelectItem>
                                                        <SelectItem value="mimar">Mimar</SelectItem>
                                                        <SelectItem value="taseron">Taşeron</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">Ekip Seçiniz</Label>
                                                <Select onValueChange={(val) => setFormData({ ...formData, team: val })}>
                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                    <SelectContent><SelectItem value="mimari">Mimari</SelectItem></SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input placeholder="TC No" value={formData.tc_no} onChange={(e) => setFormData({ ...formData, tc_no: e.target.value })} />
                                            <Input placeholder="Açıklama" />
                                        </div>

                                    </section>



                                    <div className="space-y-4">
                                        <button
                                            onClick={() => setShowExtraInfo(!showExtraInfo)}
                                            className="w-full flex items-center justify-between p-4 border rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-neutral-500" />
                                                <span className="text-sm font-semibold text-neutral-700">Ek Bilgiler & İkamet</span>
                                            </div>
                                            {showExtraInfo ? <ChevronUp className="w-4 h-4 text-neutral-400" /> : <ChevronDown className="w-4 h-4 text-neutral-400" />}
                                        </button>

                                        {showExtraInfo && (
                                            <div className="space-y-6 pt-2 animate-in slide-in-from-top-2 duration-200">
                                                <section className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-neutral-500">Ek Bilgiler</h3>
                                                    <div className="border rounded-lg p-6 space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Doğum Yeri</Label>
                                                                <div className="relative">
                                                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                                    <Input className="pl-9" placeholder="Doğum Yeri" value={formData.birth_place} onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Doğum Tarihi</Label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                                    <Input className="pl-9" type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Cinsiyet</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, gender: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="erkek">Erkek</SelectItem>
                                                                        <SelectItem value="kadin">Kadın</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Şirkete Giriş Tarihi</Label>
                                                                <div className="relative">
                                                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                                    <Input className="pl-9" type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">IBAN</Label>
                                                                <Input placeholder="TR..." value={formData.iban} onChange={(e) => setFormData({ ...formData, iban: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">SGK Sicil No</Label>
                                                                <Input value={formData.sgk_no} onChange={(e) => setFormData({ ...formData, sgk_no: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Medeni Durum</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, marital_status: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="bekar">Bekar</SelectItem>
                                                                        <SelectItem value="evli">Evli</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Çocuk Sayısı</Label>
                                                                <Input type="number" min="0" value={formData.child_count} onChange={(e) => setFormData({ ...formData, child_count: parseInt(e.target.value) || 0 })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Kan Grubu</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, blood_type: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="a_rh_p">A Rh+</SelectItem>
                                                                        <SelectItem value="b_rh_p">B Rh+</SelectItem>
                                                                        <SelectItem value="0_rh_p">0 Rh+</SelectItem>
                                                                        <SelectItem value="ab_rh_p">AB Rh+</SelectItem>
                                                                        <SelectItem value="a_rh_n">A Rh-</SelectItem>
                                                                        <SelectItem value="b_rh_n">B Rh-</SelectItem>
                                                                        <SelectItem value="0_rh_n">0 Rh-</SelectItem>
                                                                        <SelectItem value="ab_rh_n">AB Rh-</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Anne Adı</Label>
                                                                <Input value={formData.mother_name} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Baba Adı</Label>
                                                                <Input value={formData.father_name} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Nüfusa Kayıtlı Olduğu Yer</Label>
                                                                <div className="relative">
                                                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                                    <Input className="pl-9" value={formData.registry_place} onChange={(e) => setFormData({ ...formData, registry_place: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Eğitim Durumu</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, education_status: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="lise">Lise</SelectItem>
                                                                        <SelectItem value="lisans">Lisans</SelectItem>
                                                                        <SelectItem value="yuksek_lisans">Yüksek Lisans</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Askerlik Durumu</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, military_status: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="yapildi">Yapıldı</SelectItem>
                                                                        <SelectItem value="tecilli">Tecilli</SelectItem>
                                                                        <SelectItem value="muaf">Muaf</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">İşe Girişi İçin Bildirimde Bulunan Kişi / Referans</Label>
                                                                <Input value={formData.reference_person} onChange={(e) => setFormData({ ...formData, reference_person: e.target.value })} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">İşe Girişini Onaylayan Kişi</Label>
                                                                <Input value={formData.approval_person} onChange={(e) => setFormData({ ...formData, approval_person: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>

                                                <section className="space-y-4">
                                                    <h3 className="text-sm font-semibold text-neutral-500">İkamet Adres Bilgileri</h3>
                                                    <div className="border rounded-lg p-6 space-y-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Ülke Seçiniz</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, country: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="turkiye">Türkiye</SelectItem>
                                                                        <SelectItem value="kktc">KKTC</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs text-neutral-500">Şehir Seçiniz</Label>
                                                                <Select onValueChange={(val) => setFormData({ ...formData, city: val })}>
                                                                    <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="istanbul">İstanbul</SelectItem>
                                                                        <SelectItem value="ankara">Ankara</SelectItem>
                                                                        <SelectItem value="izmir">İzmir</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 space-y-2">
                                                                <Label className="text-xs text-neutral-500">Adres</Label>
                                                                <Textarea placeholder="Açık adres giriniz..." rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Şirket Yetkileri */}
                            {/* STEP 2: Şirket Yetkileri */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <Select onValueChange={(val) => {
                                            let perms = {};
                                            if (val === 'admin') {
                                                perms = { b: 'full', p: 'full', t: 'full', m: 'full', e: 'full', s: 'full', d: 'full', c: 'full' };
                                            } else if (val === 'saha') {
                                                perms = { b: 'none', p: 'none', t: 'view', m: 'full', e: 'edit', s: 'full', d: 'view', c: 'none' };
                                            } else if (val === 'ofis') {
                                                perms = { b: 'view', p: 'view', t: 'full', m: 'full', e: 'view', s: 'view', d: 'full', c: 'full' };
                                            }
                                            setFormData({ ...formData, permissions: perms });
                                        }}>
                                            <SelectTrigger className="w-full md:w-1/3 text-neutral-500">
                                                <SelectValue placeholder="Şirket Yetki Örneği Seçiniz" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Yönetici (Admin)</SelectItem>
                                                <SelectItem value="saha">Saha Personeli</SelectItem>
                                                <SelectItem value="ofis">Ofis Personeli</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="grid grid-cols-5 bg-neutral-50 p-4 text-xs font-semibold text-neutral-500 border-b">
                                                <div className="col-span-1">Özellik</div>
                                                <div className="text-center">Yok <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Görme <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Ekleme / Düzenleme <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Tam Yetki <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                            </div>

                                            {[
                                                { id: 'b', label: 'Şirket Paneli' },
                                                { id: 'p', label: 'Kullanıcı ve Personeller' },
                                                { id: 't', label: 'Taşeron ve Tedarikçiler' },
                                                { id: 'm', label: 'Malzemeler' },
                                                { id: 'e', label: 'Makine ve Ekipmanlar' },
                                                { id: 's', label: 'Güncel Durum Takibi' },
                                                { id: 'd', label: 'Denetlemeler' },
                                                { id: 'c', label: 'Sözleşmeler' },
                                            ].map((item, index) => (
                                                <div key={item.id} className={cn("grid grid-cols-5 p-4 items-center hover:bg-neutral-50 transition-colors", index !== 7 && "border-b")}>
                                                    <div className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                                        {item.label}
                                                        <Info className="w-3 h-3 text-neutral-400" />
                                                    </div>
                                                    {['none', 'view', 'edit', 'full'].map((perm) => (
                                                        <div key={perm} className="flex justify-center">
                                                            <div
                                                                onClick={() => setFormData({
                                                                    ...formData,
                                                                    permissions: { ...formData.permissions, [item.id]: perm }
                                                                })}
                                                                className={cn(
                                                                    "w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition-all",
                                                                    // @ts-ignore
                                                                    (formData.permissions[item.id] || 'none') === perm
                                                                        ? "border-blue-500 bg-white"
                                                                        : "border-neutral-300 bg-transparent"
                                                                )}
                                                            >
                                                                {/* @ts-ignore */}
                                                                {(formData.permissions[item.id] || 'none') === perm && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Doküman */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-800">Doküman Şablonu Seçimi</h3>
                                        <p className="text-sm text-neutral-500">Şablon seçin veya yeni bir şablon oluşturun.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            onClick={() => setFormData({ ...formData, document_template: 'saved' })}
                                            className={cn(
                                                "border rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-all group",
                                                formData.document_template === 'saved'
                                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                                    : "hover:border-blue-500 hover:bg-blue-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                                                formData.document_template === 'saved' ? "bg-white text-blue-600" : "bg-neutral-100 text-neutral-600 group-hover:bg-white group-hover:text-blue-600"
                                            )}>
                                                <List className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-800">Kayıtlı Doküman Şablonu Kullan</h4>
                                                <p className="text-xs text-neutral-500 mt-1">Mevcut bir şablonu seçerek hızlıca başlayın.</p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setFormData({ ...formData, document_template: 'new' })}
                                            className={cn(
                                                "border rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-all group",
                                                formData.document_template === 'new'
                                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                                                    : "hover:border-blue-500 hover:bg-blue-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
                                                formData.document_template === 'new' ? "bg-white text-blue-600" : "bg-neutral-100 text-neutral-600 group-hover:bg-white group-hover:text-blue-600"
                                            )}>
                                                <FilePlus className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-neutral-800">Yeni Doküman Şablonu Oluştur</h4>
                                                <p className="text-xs text-neutral-500 mt-1">İhtiyacınıza uygun yeni bir şablon oluşturun.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs text-neutral-500">Proje Seçiniz *</Label>
                                                <Select onValueChange={setSelectedProject} value={selectedProject}>
                                                    <SelectTrigger className="w-full md:w-1/2 border-red-300">
                                                        <div className="flex items-center gap-2">
                                                            <LayoutGrid className="w-4 h-4 text-neutral-500" />
                                                            <SelectValue placeholder="Proje Seçiniz" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="loft">Loft 777</SelectItem>
                                                        <SelectItem value="vadi">Vadi İstanbul</SelectItem>
                                                        <SelectItem value="merkez">Merkez Şantiye</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Select disabled={!selectedProject} onValueChange={(val) => {
                                                    // Template logic for projects
                                                    if (!selectedProject) return;
                                                    let perms = {};
                                                    if (val === 'yonetici') {
                                                        perms = { irsaliye: 'full', beton: 'full', talep: 'full', hakedis: 'full' };
                                                    } else if (val === 'saha') {
                                                        perms = { irsaliye: 'edit', beton: 'edit', talep: 'edit', hakedis: 'view' };
                                                    }
                                                    // @ts-ignore
                                                    const currentProjs = formData.project_permissions || {};
                                                    setFormData({
                                                        ...formData,
                                                        project_permissions: {
                                                            ...currentProjs,
                                                            [selectedProject]: perms
                                                        }
                                                    });
                                                }}>
                                                    <SelectTrigger className="w-full md:w-1/2 text-neutral-500">
                                                        <SelectValue placeholder="Proje Yetki Örneği Seçiniz" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="yonetici">Proje Yöneticisi</SelectItem>
                                                        <SelectItem value="saha">Saha Mühendisi</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="border rounded-lg overflow-hidden mt-6">
                                            <div className="grid grid-cols-5 bg-neutral-50 p-4 text-xs font-semibold text-neutral-500 border-b">
                                                <div className="col-span-1">Özellik</div>
                                                <div className="text-center">Yok <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Görme <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Ekleme / Düzenleme <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                                <div className="text-center">Tam Yetki <Info className="w-3 h-3 inline ml-1 text-neutral-400" /></div>
                                            </div>

                                            {!selectedProject ? (
                                                <div className="p-12 text-center text-neutral-400 text-sm">
                                                    Kayıt bulunamadı
                                                </div>
                                            ) : (
                                                [
                                                    { id: 'irsaliye', label: 'E-İrsaliye' },
                                                    { id: 'beton', label: 'Beton Takip' },
                                                    { id: 'talep', label: 'Satın Alma Talepleri' },
                                                    { id: 'hakedis', label: 'Hakedişler' },
                                                ].map((item, index) => (
                                                    <div key={item.id} className={cn("grid grid-cols-5 p-4 items-center hover:bg-neutral-50 transition-colors", index !== 3 && "border-b")}>
                                                        <div className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                                                            {item.label}
                                                            <Info className="w-3 h-3 text-neutral-400" />
                                                        </div>
                                                        {['none', 'view', 'edit', 'full'].map((perm) => (
                                                            <div key={perm} className="flex justify-center">
                                                                <div
                                                                    onClick={() => {
                                                                        // @ts-ignore
                                                                        const currentProjs = formData.project_permissions || {};
                                                                        const currentProjPerms = currentProjs[selectedProject] || {};
                                                                        setFormData({
                                                                            ...formData,
                                                                            project_permissions: {
                                                                                ...currentProjs,
                                                                                [selectedProject]: {
                                                                                    ...currentProjPerms,
                                                                                    [item.id]: perm
                                                                                }
                                                                            }
                                                                        });
                                                                    }}
                                                                    className={cn(
                                                                        "w-5 h-5 rounded-full border cursor-pointer flex items-center justify-center transition-all",
                                                                        // @ts-ignore
                                                                        ((formData.project_permissions?.[selectedProject]?.[item.id]) || 'none') === perm
                                                                            ? "border-blue-500 bg-white"
                                                                            : "border-neutral-300 bg-transparent"
                                                                    )}
                                                                >
                                                                    {/* @ts-ignore */}
                                                                    {((formData.project_permissions?.[selectedProject]?.[item.id]) || 'none') === perm && (
                                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="border-t pt-6 mt-6 flex justify-end gap-3">
                                {step > 1 && (
                                    <Button variant="outline" onClick={() => {
                                        const currentIdx = steps.findIndex(s => s.id === step);
                                        if (currentIdx > 0) setStep(steps[currentIdx - 1].id);
                                    }}>Geri</Button>
                                )}
                                {step !== 4 ? (
                                    <Button className="bg-[#1e293b]" onClick={() => {
                                        const currentIdx = steps.findIndex(s => s.id === step);
                                        if (currentIdx < steps.length - 1) setStep(steps[currentIdx + 1].id);
                                    }}>İleri</Button>
                                ) : (
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={loading}>
                                        {loading ? 'Kaydediliyor...' : 'Kaydet'}
                                    </Button>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
