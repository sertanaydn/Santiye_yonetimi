'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Activity,
    Truck,
    FileText,
    Settings,
    Briefcase,
    Users,
    Building,
    Menu,
    ChevronLeft,
    ChevronRight,
    Hammer,
    BarChart3,
    Package,
    Calendar,
    Receipt
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-white text-zinc-600 font-sans shadow-xl transition-all duration-300 ease-in-out border-r border-zinc-100",
                // Mobile'da her zaman tam genişlik, desktop'ta responsive
                "w-full md:w-auto",
                !onNavigate && "hidden md:flex", // Masaüstü için varsayılan stil
                collapsed ? "md:w-20" : "md:w-72"
            )}
        >

            {/* Loft 777 Brand Area */}
            <div className={cn(
                "border-b border-zinc-100 bg-white transition-all duration-300",
                collapsed ? "p-4 flex justify-center" : "p-8 pb-6"
            )}>
                <Link href="/" onClick={onNavigate} className="flex flex-col gap-1 group items-center lg:items-start cursor-pointer hover:opacity-80 transition-opacity">
                    <div className={cn(
                        "bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 transition-all duration-300",
                        collapsed ? "w-10 h-10 mb-0" : "w-12 h-12 mb-4 group-hover:scale-110 group-hover:rotate-3"
                    )}>
                        <Building className="text-white w-6 h-6" strokeWidth={1.5} />
                    </div>

                    {!collapsed && (
                        <div className="animate-in fade-in duration-300">
                            <h1 className="font-bold text-2xl text-zinc-800 tracking-tight leading-none whitespace-nowrap">LOFT 777</h1>
                            <p className="text-[10px] text-zinc-400 font-bold tracking-[0.2em] uppercase mt-1 pl-0.5 whitespace-nowrap">CAMSAN&KOPARAN</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Collapse Toggle Button (Desktop Only) */}
            <div className="hidden md:flex justify-end px-2 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
            </div>

            {/* Custom Navigation */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1">

                {!collapsed && <div className="px-4 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Yönetim Masası</div>}

                <NavItem href="/" icon={<LayoutDashboard />} label="Kontrol Paneli" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
                <NavItem href="/cari-yonetim" icon={<FileText />} label="Cari Yönetim (2026)" pathname={pathname} collapsed={collapsed} highlight onClick={onNavigate} />
                <NavItem href="/ceks" icon={<Calendar />} label="Çek Takip Takvimi" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
                <NavItem href="/faturalar" icon={<Receipt />} label="Faturalar" pathname={pathname} collapsed={collapsed} highlight onClick={onNavigate} />
                <NavItem href="/fiyat-karsilastirma" icon={<BarChart3 />} label="Fiyat Karşılaştırma" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
                <NavItem href="/siparisler" icon={<Package />} label="Siparişler" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />

                {!collapsed && <div className="px-4 mt-8 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Saha Operasyon</div>}

                <NavItem href="/demir-baglanti" icon={<Activity />} label="Demir Bağlantı" pathname={pathname} collapsed={collapsed} highlight onClick={onNavigate} />
                <NavItem href="/irsaliye/list" icon={<FileText />} label="İrsaliye Kayıtları" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
                <NavItem href="/makine-calismalari" icon={<Hammer />} label="Makine Çalışmaları" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />

                {!collapsed && <div className="px-4 mt-8 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">Kurumsal</div>}

                <NavItem href="/tedarikciler" icon={<Briefcase />} label="Tedarikçiler" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />
                <NavItem href="/personeller" icon={<Users />} label="Ekip & Personel" pathname={pathname} collapsed={collapsed} onClick={onNavigate} />

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
                <Button variant="ghost" className={cn(
                    "w-full text-zinc-500 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 hover:shadow-sm rounded-xl h-12 transition-all duration-300",
                    collapsed ? "justify-center px-0" : "justify-start pl-4"
                )}>
                    <Settings className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
                    {!collapsed && <span>Ayarlar</span>}
                </Button>
            </div>

        </div>
    );
}

// Helper specific for this design
function NavItem({ href, icon, label, pathname, highlight = false, collapsed = false, onClick }: { href: string, icon: any, label: string, pathname: string, highlight?: boolean, collapsed?: boolean, onClick?: () => void }) {
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <div className="relative group p-0 py-0.5" title={collapsed ? label : undefined}>
            <Button
                asChild
                variant="ghost"
                className={cn(
                    "w-full h-12 rounded-xl transition-all duration-300 border border-transparent",
                    collapsed ? "justify-center px-0 pl-0" : "justify-start pl-4",
                    isActive
                        ? (collapsed ? "bg-orange-50 text-orange-600" : "bg-orange-50 text-orange-700 font-semibold shadow-sm border-orange-100")
                        : (collapsed ? "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50" : "text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm hover:border-zinc-100"),
                    highlight && !isActive && "text-orange-600/80 hover:text-orange-600 hover:bg-orange-50/50"
                )}
            >
                <Link href={href} onClick={onClick}>
                    {/* Icon styling */}
                    <span className={cn(
                        "transition-all duration-300 flex items-center justify-center", // Added flex items-center for better icon alignment
                        isActive ? "text-orange-500 scale-110" : "text-zinc-400 group-hover:text-zinc-600",
                        collapsed ? "mr-0" : "mr-3"
                    )}>
                        {icon}
                    </span>

                    {!collapsed && (
                        <span className="text-sm tracking-wide duration-300 whitespace-nowrap overflow-hidden text-ellipsis">
                            {label}
                        </span>
                    )}

                    {/* Active Dot for minimal look */}
                    {!collapsed && isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500 mr-2 shadow-sm shadow-orange-200"></div>
                    )}
                </Link>
            </Button>
        </div>
    )
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-full w-10 h-10">
                    <Menu className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-white w-80 border-r border-zinc-100">
                <Sidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    )
}
