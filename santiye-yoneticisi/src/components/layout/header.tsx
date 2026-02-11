'use client';

import { Building2, ChevronDown, Bell, Search, User, LogOut, Settings, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";

// ... imports
import React, { useState, useEffect } from "react";
// ... imports

export function Header() {
    const router = useRouter();
    const [notificationCount, setNotificationCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            const { count } = await supabase
                .from('purchase_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'Bekliyor');

            setNotificationCount(count || 0);
        };

        fetchNotifications();

        // Optional: Subscribe to changes (simple polling for now or just initial fetch)
        // For a true real-time app we'd use .on(...) but let's stick to fetch on mount for simplicity unless requested
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-6 shadow-sm z-20 relative font-sans transition-all">

            {/* Left: Project Context */}
            <div className="flex items-center gap-4 md:gap-8">

                {/* Mobile Menu Trigger */}
                <MobileSidebar />

                {/* Active Project Indicator */}
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-sm group-hover:bg-orange-100 transition-colors">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">CAMSAN&KOPARAN</span>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-zinc-800 leading-none tracking-tight">LOFT 777</h2>
                            <ChevronDown className="w-3 h-3 text-zinc-400" />
                        </div>
                    </div>
                </div>

                <div className="h-10 w-px bg-zinc-100 hidden md:block"></div>

            </div>

            {/* Right: User & Actions */}
            <div className="flex items-center gap-6">

                {/* Search Bar - Active */}
                <div className="hidden md:flex items-center bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 w-64 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <Search className="w-4 h-4 text-zinc-400 mr-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-700 placeholder:text-zinc-400 w-full"
                        placeholder="Aranacak kelime..."
                    />
                </div>

                <div className="flex items-center gap-2 text-zinc-500">
                    <Button variant="ghost" size="icon" className="relative hover:bg-zinc-100 rounded-lg w-10 h-10 text-zinc-500">
                        <Bell className="w-5 h-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        )}
                    </Button>
                </div>

                <div className="h-6 w-px bg-zinc-100"></div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-3 hover:bg-zinc-50 pl-2 pr-4 py-1 h-12 rounded-lg border border-zinc-200/50">
                            <div className="w-8 h-8 rounded-md bg-orange-600 flex items-center justify-center text-sm font-bold text-white shadow-sm shadow-orange-200">
                                S
                            </div>
                            <div className="hidden md:flex flex-col items-start gap-0.5">
                                <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-wide leading-none">Sertan AYDIN</span>
                                <span className="text-[9px] text-zinc-400 font-medium leading-none">Proje Müdürü</span>
                            </div>
                            <ChevronDown className="w-3 h-3 text-zinc-400 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-200 shadow-xl bg-white p-2">
                        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-zinc-400 font-bold px-2 py-1.5">Hesap Yönetimi</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-100" />
                        <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-orange-50 focus:text-orange-700 px-2 py-2">
                            <User className="mr-2 h-4 w-4" /> Profilim
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer rounded-lg focus:bg-orange-50 focus:text-orange-700 px-2 py-2">
                            <Settings className="mr-2 h-4 w-4" /> Sistem Ayarları
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-100" />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer rounded-lg focus:text-red-700 focus:bg-red-50 px-2 py-2">
                            <LogOut className="mr-2 h-4 w-4" /> Güvenli Çıkış
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </header>
    );
}
