
'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { supabase } from "@/lib/supabase";
import { Calendar, AlertCircle, ArrowRight } from "lucide-react";

export default function Home() {
  const [stats, setStats] = useState({
    waybillCount: 0,
    requestCount: 0,
    totalConcrete: 0
  });

  const [upcomingChecks, setUpcomingChecks] = useState<any[]>([]);
  const [loadingChecks, setLoadingChecks] = useState(true);

  useEffect(() => {
    // Fetch stats
    fetch('/api/dashboard-stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(err => console.error(err));

    // Fetch upcoming checks
    fetchUpcomingChecks();
  }, []);

  const fetchUpcomingChecks = async () => {
    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const { data, error } = await supabase
        .from('concrete_invoices')
        .select('id, invoice_number, grand_total, check_due_date')
        .gte('check_due_date', today.toISOString())
        .lte('check_due_date', nextMonth.toISOString())
        .order('check_due_date', { ascending: true })
        .limit(5); // Show max 5 on dashboard

      if (!error) {
        setUpcomingChecks(data || []);
      }
    } catch (error) {
      console.error('Error fetching checks:', error);
    } finally {
      setLoadingChecks(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa]">
      <PageHeader title="Şantiye Yöneticisi" subtitle="LOFT 777 MERKEZİ KONTROL PANELİ" />

      <div className="flex-1 overflow-y-auto p-6 font-sans">
        <div className="w-full max-w-2xl mx-auto space-y-8">

          {/* Dashboard Cards - Loft 777 Minimalist Style */}
          <div className="grid grid-cols-2 gap-4">



            {/* UPCOMING PAYMENTS WIDGET (NEW) */}
            <div className="col-span-2 bg-white border border-zinc-100 rounded-2xl p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-4 border-b border-zinc-50 bg-orange-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="bg-white p-1.5 rounded-lg text-orange-600 shadow-sm border border-orange-100">
                    <AlertCircle className="w-4 h-4" />
                  </span>
                  <h3 className="font-bold text-zinc-800 text-sm">Yaklaşan Ödemeler (30 Gün)</h3>
                </div>
                <Link href="/ceks">
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-bold text-zinc-400 hover:text-orange-600 hover:bg-white rounded-lg">
                    Tümünü Gör <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="p-2">
                {loadingChecks ? (
                  <div className="text-center py-4 text-xs text-zinc-400">Yükleniyor...</div>
                ) : upcomingChecks.length === 0 ? (
                  <div className="text-center py-6 text-zinc-400 text-sm flex flex-col items-center gap-2">
                    <span className="text-2xl opacity-50">🎉</span>
                    <span>Yaklaşan ödeme bulunamadı.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 divide-y divide-zinc-50">
                    {upcomingChecks.map((check) => {
                      const daysLeft = Math.ceil((new Date(check.check_due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysLeft <= 7;
                      return (
                        <div key={check.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 transition-colors rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg border ${isUrgent ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-zinc-200 text-zinc-500 shadow-sm'}`}>
                              <span className="text-[10px] font-bold uppercase">{new Date(check.check_due_date).toLocaleDateString('tr-TR', { month: 'short' })}</span>
                              <span className="text-sm font-bold leading-none">{new Date(check.check_due_date).getDate()}</span>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-800">{check.invoice_number}</div>
                              <div className={`text-[10px] font-bold ${isUrgent ? 'text-red-500' : 'text-zinc-400'}`}>
                                {daysLeft < 0 ? 'VADESİ GEÇTİ' : `${daysLeft} GÜN KALDI`}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono font-bold text-right text-zinc-700 text-sm">
                            {Number(check.grand_total).toLocaleString('tr-TR')} ₺
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Demir Bağlantı Kartı (v2) - Hero Card (Soft Light Theme) */}
            <Link href="/demir-baglanti" className="block col-span-2 bg-gradient-to-br from-white to-zinc-50 rounded-2xl p-6 relative overflow-hidden shadow-lg shadow-zinc-200/50 group cursor-pointer border border-zinc-100 hover:border-orange-200 transition-all active:scale-[0.99]">
              {/* Decorative background element */}
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-orange-500/5 skew-x-[-20deg] mr-[-20px] transition-transform group-hover:skew-x-[-10deg]"></div>

              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-sm shadow-orange-300"></div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Ana Yönetim Modülü</span>
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-800 tracking-tight font-sans">Demir & Bağlantı Yönetimi</h3>
                  <p className="text-zinc-500 text-xs mt-1 max-w-md font-medium">Aktif bağlantılar, stok durumu ve sevkiyat planlaması.</p>
                </div>
                <Button className="bg-zinc-900 hover:bg-orange-600 text-white rounded-xl px-6 h-10 font-bold tracking-wide border-none shadow-xl shadow-zinc-900/10 pointer-events-none transition-colors">
                  YÖNETİM PANELİ <span className="ml-2">→</span>
                </Button>
              </div>
            </Link>

            {/* Talep Kartı (Compact) */}
            <div className="col-span-2 bg-white border border-zinc-100 rounded-2xl p-4 flex justify-between items-center group hover:bg-zinc-50 transition-colors shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 rounded-xl shadow-sm">
                  <span className="text-lg">🛒</span>
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-800">Malzeme Talepleri</div>
                  <div className="text-xs text-zinc-500 font-medium group-hover:text-blue-600 transition-colors">{stats.requestCount} adet onay bekleyen talep var</div>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="h-8 text-xs bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600 rounded-lg">
                <Link href="/talep">İncele</Link>
              </Button>
            </div>

          </div>

          {/* Quick Actions Title */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[1px] bg-zinc-100 flex-1"></div>
              <h4 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest whitespace-nowrap">Hızlı İşlemler</h4>
              <div className="h-[1px] bg-zinc-100 flex-1"></div>
            </div>

            {/* Action Buttons (Architectural Style) */}
            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="col-span-1 w-full h-16 bg-white border border-zinc-100 hover:border-blue-200 hover:bg-blue-50/50 text-zinc-800 justify-start px-4 gap-3 shadow-sm hover:shadow-md rounded-2xl group transition-all">
                <Link href="/irsaliye">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 flex items-center justify-center rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <span className="text-xl">🚚</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold tracking-tight">Yeni İrsaliye</span>
                    <span className="text-[10px] text-zinc-400 font-normal group-hover:text-blue-600/70">Malzeme Girişi</span>
                  </div>
                </Link>
              </Button>

              <Button asChild className="col-span-1 w-full h-16 bg-white border border-zinc-100 hover:border-orange-200 hover:bg-orange-50/50 text-zinc-800 justify-start px-4 gap-3 shadow-sm hover:shadow-md rounded-2xl group transition-all">
                <Link href="/beton">
                  <div className="w-10 h-10 bg-orange-50 text-orange-600 flex items-center justify-center rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <span className="text-xl">🏗️</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-bold tracking-tight">Beton Döküm</span>
                    <span className="text-[10px] text-zinc-400 font-normal group-hover:text-orange-600/70">Günlük Takip</span>
                  </div>
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
