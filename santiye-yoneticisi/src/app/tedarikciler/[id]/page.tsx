
'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, User, FileText, Globe, Pencil, Trash2, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export default function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [supplier, setSupplier] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSupplier() {
            if (!params.id) return;
            const { data, error } = await supabase
                .from('suppliers')
                .select('*')
                .eq('id', params.id)
                .single();

            if (data) setSupplier(data);
            setLoading(false);
        }
        fetchSupplier();
    }, [params.id]);

    if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
    if (!supplier) return <div className="p-10 text-center text-red-500">Firma bulunamadı.</div>;

    const handleDelete = async () => {
        if (!confirm("Bu firmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;

        try {
            const res = await fetch(`/api/suppliers/${params.id}`, { method: 'DELETE' });
            if (res.ok) {
                // alert("Firma silindi"); // Optional: use toast if available
                router.push('/tedarikciler');
            } else {
                alert("Silme işlemi başarısız oldu.");
            }
        } catch (e) {
            console.error(e);
            alert("Bir hata oluştu.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title={supplier?.name || "Firma Detayı"} backLink="/tedarikciler">
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600 h-9" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                    </Button>
                    <Link href={`/tedarikciler/${params.id}/duzenle`}>
                        <Button className="bg-blue-500 hover:bg-blue-600 h-9" size="sm">
                            <Pencil className="w-4 h-4 mr-2" /> Düzenle
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="rounded-lg border overflow-hidden bg-white shadow-sm">

                    {/* Content Tabs Area */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column (Main Info) */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Firma Bilgileri Section */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-[#1e293b] px-4 py-2 flex items-center justify-between">
                                    <span className="text-white text-sm font-medium">Firma Bilgileri</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Firma Adı</div>
                                        <div className="text-sm text-neutral-800 font-medium">{supplier.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Firma Tipi</div>
                                        <div className="text-sm text-neutral-800">{supplier.type === 'taseron' ? 'Taşeron' : 'Tedarikçi'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Email</div>
                                        <div className="text-sm text-neutral-800">{supplier.email || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Telefon</div>
                                        <div className="text-sm text-neutral-800">{supplier.phone || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Ticari Faaliyetler</div>
                                        <div className="flex gap-1">
                                            <Badge className="bg-orange-400 hover:bg-orange-500">Seramik</Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Usage Section */}
                                <div className="p-4 border-t bg-neutral-50">
                                    <div className="flex items-center gap-2">
                                        <SwitchChecked />
                                        <span className="text-sm text-neutral-700">Bütün Projelerde Aktif Kullanılsın</span>
                                    </div>
                                </div>
                            </div>

                            {/* Adres Bilgileri Section */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-[#1e293b] px-4 py-2">
                                    <span className="text-white text-sm font-medium">Adres Bilgileri</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Ülke</div>
                                        <div className="text-sm text-neutral-800">Türkiye</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Şehir</div>
                                        <div className="text-sm text-neutral-800">{supplier.city || '-'}</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Adres</div>
                                        <div className="text-sm text-neutral-800">{supplier.address || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Yetkili Kişi Section */}
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-[#1e293b] px-4 py-2">
                                    <span className="text-white text-sm font-medium">Yetkili Kişi Bilgileri</span>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-y-6">
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Yetkili Kişi</div>
                                        <div className="text-sm text-neutral-800">{supplier.contact_name || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 font-semibold mb-1">Yetkili Email</div>
                                        <div className="text-sm text-neutral-800">{supplier.contact_email || '-'}</div>
                                    </div>
                                </div>
                            </div>


                        </div>

                        {/* Right Column (Side Info) */}
                        <div className="space-y-6">
                            {/* Kayıt Bilgileri */}
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-[#1e293b] px-4 py-2">
                                    <span className="text-white text-sm font-medium">Kayıt Bilgileri</span>
                                </div>
                                <div className="p-4 bg-white space-y-4">
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-1">Oluşturan</div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center text-xs">S</div>
                                            <span className="text-sm font-medium">Sertan AYDIN</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-1">Oluşturma Tarihi</div>
                                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded text-xs font-mono">
                                            <CheckCircle2 className="w-3 h-3" /> {new Date(supplier.created_at).toLocaleDateString("tr-TR")}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dökümanlar */}
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-[#1e293b] px-4 py-2 flex justify-between items-center">
                                    <span className="text-white text-sm font-medium">Dökümanlar</span>
                                    <span className="bg-neutral-600 text-white text-[10px] px-1.5 py-0.5 rounded">0</span>
                                </div>
                                <div className="p-8 text-center bg-white text-neutral-400 text-xs">
                                    Ek döküman yoktur.
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function SwitchChecked() {
    return (
        <div className="w-9 h-5 bg-orange-500 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1"></div>
        </div>
    )
}
