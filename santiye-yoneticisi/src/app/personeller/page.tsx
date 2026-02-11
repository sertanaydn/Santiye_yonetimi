'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Users,
    UserCheck,
    UserX,
    Building2,
    LayoutGrid,
    Filter,
    RefreshCcw,
    Download,
    Trash2,
    Plus,
    Search,
    Settings,
    MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/page-header";

export default function PersonnelPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // all, active, passive, company, project

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        const { data } = await supabase.from('personnel').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
        setLoading(false);
    }

    // Filter Logic (Simple client-side for demo)
    // Filter Logic (Simple client-side for demo)
    const filteredUsers = users.filter(user => {
        if (activeTab === 'active') return user.is_active;
        if (activeTab === 'passive') return !user.is_active;
        if (activeTab === 'company') return user.role && (user.role.toLowerCase().includes('yönetici') || user.role.toLowerCase().includes('admin'));
        if (activeTab === 'project') return user.role && !user.role.toLowerCase().includes('yönetici'); // Mock logic: non-admins are field/project staff
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">

            {/* Page Header - Dark Bar with Red Icon */}
            <div className="bg-[#1e293b] text-white p-4 h-16 flex items-center justify-between shrink-0 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-500 rounded-md shadow-sm">
                        <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold tracking-wide">Şirket Kullanıcıları</h1>
                        <div className="w-5 h-5 rounded-full border border-neutral-500 flex items-center justify-center text-[10px] text-neutral-400 cursor-help">?</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/personeller/yeni">
                        <Button className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg p-0 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-white/20 mx-2"></div>
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
                        <RefreshCcw className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden p-6 gap-6">

                {/* Left Sub-Sidebar (Cards/Tabs) */}
                <div className="w-64 space-y-4 hidden md:block shrink-0">

                    {/* User Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-neutral-200 mb-3 flex items-center justify-center text-xl font-bold text-neutral-500">
                            S
                        </div>
                        <h3 className="font-semibold text-neutral-800">sertan</h3>
                    </div>

                    {/* Navigation Menu */}
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3 bg-neutral-50/50 border-b">
                            Kullanıcılar
                        </div>
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === 'all' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Users className="w-4 h-4" /> Tüm Kullanıcılar
                            </button>
                            <button
                                onClick={() => setActiveTab('active')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === 'active' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <UserCheck className="w-4 h-4" /> Aktif Kullanıcılar
                            </button>
                            <button
                                onClick={() => setActiveTab('passive')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === 'passive' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <UserX className="w-4 h-4" /> Pasif Kullanıcılar
                            </button>
                        </div>

                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-4 py-3 bg-neutral-50/50 border-b border-t">
                            Gruplar
                        </div>
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => setActiveTab('company')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === 'company' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <Building2 className="w-4 h-4" /> Şirket
                            </button>
                            <button
                                onClick={() => setActiveTab('project')}
                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors", activeTab === 'project' ? "bg-blue-50 text-blue-600" : "text-neutral-600 hover:bg-neutral-50")}
                            >
                                <LayoutGrid className="w-4 h-4" /> Demo Proje
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Content (Toolbar & Table) */}
                <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-4 border-b flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Button size="icon" className="w-9 h-9 rounded-full bg-blue-500 hover:bg-blue-600 text-white" onClick={fetchUsers}>
                                <RefreshCcw className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" className="bg-[#2d3748] text-white border-none hover:bg-[#4a5568] hover:text-white h-9 px-4 text-xs font-medium">
                                <Filter className="w-3 h-3 mr-2" /> Filtrele
                            </Button>
                            <Button variant="outline" className="bg-green-500 text-white border-none hover:bg-green-600 hover:text-white h-9 px-4 text-xs font-medium">
                                <Download className="w-3 h-3 mr-2" /> Excel
                            </Button>
                        </div>
                        {/* Search could go here */}
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50/50 border-b text-[11px] font-bold text-neutral-400 uppercase tracking-wider items-center">
                        <div className="col-span-3">Ad Soyad</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-2">Telefon</div>
                        <div className="col-span-1">İş Ünvanı</div>
                        <div className="col-span-1">Firma Adı</div>
                        <div className="col-span-2 text-right">Durumlar</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                Yükleniyor...
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                                <Users className="w-10 h-10 mb-2 opacity-20" />
                                Kayıt bulunamadı.
                            </div>
                        ) : (
                            filteredUsers.map((user, idx) => (
                                <div key={user.id} className={cn("grid grid-cols-12 gap-4 px-6 py-4 border-b items-center hover:bg-neutral-50 transition-colors group text-sm", idx % 2 === 0 ? "bg-white" : "bg-neutral-50/30")}>
                                    <div className="col-span-3 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600 shrink-0">
                                            {(user.name || '?').split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-neutral-800">{user.name}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-neutral-600 truncate">{user.email}</div>
                                    <div className="col-span-2 text-neutral-600 text-xs">{user.phone || '-'}</div>
                                    <div className="col-span-1 text-neutral-600 text-xs">{user.role || '-'}</div>
                                    <div className="col-span-1 text-neutral-600 text-xs">{user.company || 'Demo - XYZ'}</div>

                                    <div className="col-span-2 flex justify-end items-center gap-3">
                                        {/* Status Indicators */}
                                        <div className="flex items-center gap-3 mr-2">
                                            <div className="w-3 h-3 rounded-full border border-neutral-300" title="Davet"></div>
                                            <div className="w-3 h-3 rounded-full border border-neutral-300" title="Yetkili"></div>
                                            <div className={cn("w-3 h-3 rounded-full", user.is_active ? "bg-green-500" : "bg-neutral-300")} title="Aktif"></div>
                                        </div>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="border-t p-3 flex items-center justify-between text-xs text-neutral-500 bg-neutral-50/30">
                        <div>
                            Toplam: <span className="font-semibold">{filteredUsers.length}</span> kayıt | 1 - {filteredUsers.length} arası gösteriliyor
                        </div>
                        <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-neutral-500" disabled>&lt;</Button>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-neutral-500" disabled>&gt;</Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
