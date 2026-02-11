'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, RotateCw, Trash2, BarChart2, Calendar, LayoutGrid, Plus, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/page-header";

export default function CompanyPanelPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (data) setProjects(data);
        setLoading(false);
    }

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Şirket Paneli" />

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Toolbar */}
                <div className="flex items-center gap-2">
                    <Button size="icon" className="bg-blue-500 hover:bg-blue-600 w-8 h-8 rounded-full" onClick={fetchProjects}>
                        <RotateCw className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="h-8 text-xs bg-[#2d3748] text-white border-none hover:bg-[#4a5568] hover:text-white">
                        <Filter className="w-3 h-3 mr-1" /> Filtrele
                    </Button>
                </div>

                {/* Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {loading ? (
                        <div className="col-span-4 text-center p-10 text-neutral-500">Yükleniyor...</div>
                    ) : projects.length === 0 ? (
                        <div className="col-span-4 text-center p-10 text-neutral-500">Henüz proje yok. Sağ alttan ekleyin.</div>
                    ) : (
                        projects.map((project) => (
                            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                                <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
                                    <div>
                                        <CardTitle className="text-sm font-medium truncate w-32" title={project.name}>{project.name}</CardTitle>
                                        <p className="text-xs text-blue-500 capitalize">{project.type}</p>
                                    </div>
                                    <div className="w-4 h-4 text-neutral-400 group-hover:text-blue-500">↗</div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="bg-neutral-100 h-32 flex items-center justify-center border-y overflow-hidden relative">
                                        {project.image_url ? (
                                            <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <LayoutGrid className="w-12 h-12 text-neutral-300" />
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 flex flex-col items-start gap-2">
                                    <p className="text-xs text-neutral-500 flex items-start gap-1">
                                        <MapPin className="w-3 h-3 mt-0.5" />
                                        <span className="capitalize">{project.city || '-'}, {project.country || 'TR'}</span>
                                    </p>
                                    <Separator />
                                    <div className="w-full flex items-center justify-between text-[10px] text-neutral-400">
                                        <span>Güncel Durum</span>
                                        <span>%0.00</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-orange-500 h-full w-[0%]"></div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}

                </div>

                {/* Floating Add Project Button */}
                <div className="fixed bottom-8 right-8">
                    <Link href="/sirket-paneli/proje-ekle">
                        <Button className="w-14 h-14 rounded-full bg-[#1e293b] hover:bg-[#2d3748] shadow-lg flex items-center justify-center transition-transform hover:scale-105">
                            <Plus className="w-8 h-8 text-white" />
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
