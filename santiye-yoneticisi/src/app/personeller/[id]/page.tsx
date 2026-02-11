
'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Mail,
    Phone,
    CreditCard,
    Edit,
    CheckCircle2,
    Clock,
    Building2,
    Briefcase,
    Crown
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

export default function PersonnelDetailPage() {
    const params = useParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchUser(params.id as string);
        }
    }, [params.id]);

    async function fetchUser(id: string) {
        const { data } = await supabase.from('personnel').select('*').eq('id', id).single();
        if (data) setUser(data);
        setLoading(false);
    }

    if (loading) return <div className="p-10 text-center text-neutral-500">Yükleniyor...</div>;
    if (!user) return <div className="p-10 text-center text-red-500">Kullanıcı bulunamadı.</div>;

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Personel Detayı" backLink="/personeller" />

            {/* Profile Summary Section */}
            <div className="bg-[#1e293b] text-white p-6 pb-0 shadow-md z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-6 pb-6">
                            <div className="w-20 h-20 rounded-full bg-neutral-600 flex items-center justify-center text-2xl font-bold border-4 border-[#1e293b] relative">
                                {user.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#1e293b]"></div>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{user.name}</h1>
                                <p className="text-neutral-400">{user.role || 'Görevi Yok'} <span className="mx-2">•</span> {user.company || 'Firma Yok'}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {/* Tabs Header */}
                            <div className="flex gap-6 text-sm font-medium self-end translate-y-[1px]">
                                <div className="pb-4 border-b-2 border-blue-500 text-blue-400 cursor-pointer">GENEL BİLGİLER</div>
                                <div className="pb-4 text-neutral-400 hover:text-white cursor-pointer">DOKÜMANLAR</div>
                                <div className="pb-4 text-neutral-400 hover:text-white cursor-pointer">PUANTAJ</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">

                    {/* Left Column (Main Info) */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">

                        {/* Temel Bilgiler Card */}
                        <div className="bg-white rounded border shadow-sm p-6 relative">
                            <div className="absolute top-4 right-4">
                                <Crown className="w-6 h-6 text-yellow-500" />
                            </div>

                            <h3 className="text-sm font-semibold text-neutral-800 border-b pb-4 mb-4">Temel Bilgiler</h3>

                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Adı</label>
                                    <div className="text-sm text-neutral-800">{user.name}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Durum</label>
                                    <div className="flex items-center gap-1">
                                        {user.is_active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full bg-red-500"></div>}
                                        {user.is_company_official && <CheckCircle2 className="w-4 h-4 text-green-500 ml-1" />}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Email</label>
                                    <div className="text-sm text-blue-600">{user.email}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Telefon</label>
                                    <div className="text-sm text-neutral-800">{user.phone || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Firma Adı</label>
                                    <div className="text-sm text-neutral-800">{user.company}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Firma Yetkisi</label>
                                    <div className="text-sm text-neutral-800">{user.is_company_official ? 'Yetkili' : '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">İş Ünvanı</label>
                                    <div className="text-sm text-neutral-800">{user.role}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Ekip</label>
                                    <div className="text-sm text-neutral-800">{user.team || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">TC No</label>
                                    <div className="text-sm text-neutral-800">{user.tc_no || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Açıklama</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                            </div>

                            <div className="mt-8 border-t pt-4">
                                <label className="text-xs font-bold text-neutral-500 block mb-2">Yer Alacağı Projeler</label>
                                <span className="inline-block bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">Demo Proje</span>
                            </div>
                        </div>

                        {/* Ek Bilgiler Card */}
                        <div className="bg-white rounded border shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-bg-[#1e293b] bg-[#1e293b] text-white -mx-6 -mt-6 p-3 px-6 rounded-t mb-6">Ek Bilgiler</h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Doğum Yeri</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Doğum Tarihi</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                            </div>
                        </div>

                        {/* Adres Card */}
                        <div className="bg-white rounded border shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-bg-[#1e293b] bg-[#1e293b] text-white -mx-6 -mt-6 p-3 px-6 rounded-t mb-6">İkamet Adresi Bilgileri</h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Ülke</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Şehir</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-neutral-500 block mb-1">Adres</label>
                                    <div className="text-sm text-neutral-800">-</div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Meta Info) */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600 rounded-full">
                            <Edit className="w-4 h-4 mr-2" /> Düzenle
                        </Button>

                        {/* Kayıt Bilgileri */}
                        <div className="bg-white rounded border shadow-sm overflow-hidden">
                            <div className="bg-[#1e293b] text-white p-3 text-xs font-semibold">Kayıt Bilgileri</div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <div className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Oluşturan Bilgisi</div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold">SA</div>
                                        <span className="text-xs text-neutral-700">Sertan AYDIN</span>
                                    </div>
                                    <div className="mt-1">
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-none text-[10px]">
                                            {new Date(user.created_at).toLocaleDateString('tr-TR')}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Oturum Bilgisi */}
                        <div className="bg-white rounded border shadow-sm overflow-hidden">
                            <div className="bg-[#1e293b] text-white p-3 text-xs font-semibold">Oturum Bilgisi</div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold">
                                            {user.name.split(' ').map((n: any) => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <span className="text-xs text-neutral-700">{user.name}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-[10px] text-neutral-400">28.01.2026 11:46:29</span>
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
