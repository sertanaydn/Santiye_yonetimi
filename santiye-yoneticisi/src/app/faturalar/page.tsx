'use client';

import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { fileURLToPath } from "url";
import { BrickWall, Container, Receipt, FileText } from "lucide-react";

export default function InvoicesPage() {
    const cards = [
        {
            title: "Canbek",
            description: "Camsan / Koparan ortak beton alımları ve takibi",
            icon: BrickWall,
            href: "/faturalar/beton",
            color: "bg-blue-500",
            lightColor: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            title: "Öztop",
            description: "İnşaat demiri alımları ve tonaj takibi",
            icon: Container,
            href: "/faturalar/demir",
            color: "bg-orange-500",
            lightColor: "bg-orange-50",
            textColor: "text-orange-600"
        },
        {
            title: "Genel Faturalar",
            description: "Nalburiye, yakıt, yemek ve diğer şantiye giderleri",
            icon: Receipt,
            href: "/faturalar/genel",
            color: "bg-green-500",
            lightColor: "bg-green-50",
            textColor: "text-green-600"
        }
    ];

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Fatura Yönetim Merkezi">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <FileText className="w-4 h-4" />
                    <span>Tüm şantiye faturalarını buradan yönetebilirsiniz.</span>
                </div>
            </PageHeader>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <Link key={card.title} href={card.href} className="group relative overflow-hidden bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${card.lightColor} rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110`} />

                        <div className="relative z-10">
                            <div className={`w-12 h-12 ${card.lightColor} ${card.textColor} rounded-xl flex items-center justify-center mb-4`}>
                                <card.icon className="w-6 h-6" />
                            </div>

                            <h3 className="text-lg font-bold text-neutral-800 mb-2">{card.title}</h3>
                            <p className="text-sm text-neutral-500 mb-6">{card.description}</p>

                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${card.textColor} uppercase tracking-wider`}>Giriş Yap &rarr;</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="px-6 pb-6">
                {/* Recent Activity or Summary could go here */}
            </div>
        </div>
    );
}
