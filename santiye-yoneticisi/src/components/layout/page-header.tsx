
import { ArrowLeft, HelpCircle, BarChart3, Trash2, History, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    backLink?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backLink, children }: PageHeaderProps) {
    return (
        <div className="bg-white text-zinc-800 p-4 h-16 flex items-center justify-between shrink-0 border-b border-zinc-100 shadow-sm transition-all">
            <div className="flex items-center gap-4">
                {backLink && (
                    <Link href={backLink}>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full h-8 w-8">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                )}
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-orange-50 rounded-lg border border-orange-100 shadow-sm">
                        <Building className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight leading-none text-zinc-800">{title}</h1>
                        {subtitle && <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase leading-none mt-1">{subtitle}</p>}
                    </div>
                    <HelpCircle className="w-4 h-4 text-zinc-300 cursor-help hover:text-orange-500 transition-colors ml-1" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {children}

                {/* Default Actions if children not provided or appended */}
                {!children && (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-orange-600 rounded-full w-8 h-8 transition-colors">
                            <Building className="w-4 h-4" />
                        </Button>
                        <div className="h-6 w-px bg-zinc-100 mx-2"></div>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full w-8 h-8">
                            <BarChart3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-full w-8 h-8">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-full w-8 h-8">
                            <History className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
