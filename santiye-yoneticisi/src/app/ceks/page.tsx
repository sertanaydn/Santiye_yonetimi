'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calculator, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function CheckCalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [checks, setChecks] = useState<any[]>([]);
    const [upcomingChecks, setUpcomingChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChecks();
    }, [currentDate]);

    useEffect(() => {
        fetchUpcomingChecks();
    }, []);

    const fetchUpcomingChecks = async () => {
        try {
            const today = new Date();
            const nextMonth = new Date();
            nextMonth.setDate(today.getDate() + 30);

            const { data, error } = await supabase
                .from('concrete_invoices')
                .select('id, invoice_number, grand_total, check_due_date, invoice_date')
                .gte('check_due_date', today.toISOString())
                .lte('check_due_date', nextMonth.toISOString())
                .order('check_due_date', { ascending: true });

            if (error) throw error;
            setUpcomingChecks(data || []);
        } catch (error) {
            console.error('Error fetching upcoming checks:', error);
        }
    };

    const fetchChecks = async () => {
        setLoading(true);
        try {
            // Calculate start and end of the month
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const startStr = new Date(year, month, 1).toISOString();
            const endStr = new Date(year, month + 1, 0).toISOString();

            // Fetch concrete invoices with check_due_date in this month
            const { data, error } = await supabase
                .from('concrete_invoices')
                .select('id, invoice_number, grand_total, check_due_date, invoice_date')
                .gte('check_due_date', startStr)
                .lte('check_due_date', endStr);

            if (error) throw error;
            setChecks(data || []);
        } catch (error: any) {
            console.error(error);
            toast.error('Çek verileri yüklenemedi');
        } finally {
            setLoading(false);
        }
    };

    // Calendar logic
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        // 0 = Sunday, 1 = Monday, ... 6 = Saturday
        // We want Monday to be 0
        let day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    const generateCalendarDays = () => {
        const days = [];

        // Previous month days
        for (let i = 0; i < firstDay; i++) {
            days.push({ day: prevMonthDays - firstDay + 1 + i, type: 'prev' });
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, type: 'current' });
        }

        // Next month days to fill grid (42 cells: 6 rows * 7 cols)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, type: 'next' });
        }

        return days;
    };

    const getChecksForDay = (day: number) => {
        return checks.filter(check => {
            const checkDate = new Date(check.check_due_date);
            return checkDate.getDate() === day &&
                checkDate.getMonth() === currentDate.getMonth() &&
                checkDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const totalAmount = checks.reduce((sum, check) => sum + Number(check.grand_total), 0);

    return (
        <div className="flex flex-col md:flex-row h-full bg-[#f8f9fa] p-4 gap-6">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <PageHeader title="Çek Takip Takvimi" subtitle="Beton ve diğer ödemelerin çek vadeleri" />
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-neutral-200">
                        <span className="text-sm text-neutral-500 font-bold uppercase">Bu Ay Toplam Ödeme</span>
                        <span className="text-xl font-mono font-bold text-red-600">
                            {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                        </span>
                    </div>
                </div>

                <Card className="flex-1 bg-white border-neutral-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Calendar Header */}
                    <div className="p-4 flex justify-between items-center border-b bg-neutral-50">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-neutral-500" />
                            <h2 className="text-xl font-bold text-neutral-800">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Bugün</Button>
                            <Button variant="outline" size="icon" onClick={handleNextMonth}>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7 border-b bg-neutral-50">
                            {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(day => (
                                <div key={day} className="p-3 text-center text-sm font-bold text-neutral-500 uppercase tracking-wider">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 auto-rows-fr h-full bg-neutral-200 gap-[1px]">
                            {generateCalendarDays().map((date, index) => {
                                const dayChecks = date.type === 'current' ? getChecksForDay(date.day) : [];
                                const dayTotal = dayChecks.reduce((sum, c) => sum + Number(c.grand_total), 0);
                                const isToday = date.type === 'current' &&
                                    date.day === new Date().getDate() &&
                                    currentDate.getMonth() === new Date().getMonth() &&
                                    currentDate.getFullYear() === new Date().getFullYear();

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[100px] p-2 bg-white flex flex-col relative group transition-colors hover:bg-neutral-50
                                            ${date.type !== 'current' ? 'bg-neutral-50 text-neutral-400' : ''}
                                            ${isToday ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                                                ${isToday ? 'bg-blue-600 text-white' : ''}
                                            `}>
                                                {date.day}
                                            </span>
                                            {dayTotal > 0 && (
                                                <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                                    {dayTotal.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
                                            {dayChecks.map(check => (
                                                <div
                                                    key={check.id}
                                                    className="text-[10px] p-1.5 bg-blue-50 border border-blue-100 rounded text-blue-800 hover:bg-blue-100 transition-colors cursor-pointer truncate"
                                                    title={`Fatura: ${check.invoice_number} - ${Number(check.grand_total).toLocaleString('tr-TR')} TRY`}
                                                >
                                                    <div className="font-bold flex justify-between">
                                                        <span>{check.invoice_number}</span>
                                                    </div>
                                                    <div className="font-mono text-right">
                                                        {Number(check.grand_total).toLocaleString('tr-TR')} ₺
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Upcoming Payments Sidebar */}
            <Card className="w-80 bg-white border-neutral-200 shadow-sm flex flex-col h-full overflow-hidden shrink-0">
                <div className="p-4 border-b bg-orange-50/50 flex flex-col gap-1">
                    <h3 className="font-bold text-orange-900 flex items-center gap-2">
                        <span className="bg-orange-100 p-1 rounded text-orange-600">⚠️</span>
                        Yaklaşan Ödemeler
                    </h3>
                    <p className="text-xs text-orange-600/80 font-medium ml-8">Önümüzdeki 30 Gün</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {upcomingChecks.length === 0 ? (
                        <div className="text-center py-8 text-neutral-400 text-sm">
                            Yaklaşan ödeme bulunamadı.
                        </div>
                    ) : (
                        upcomingChecks.map((check) => {
                            const date = new Date(check.check_due_date);
                            const today = new Date();
                            const diffTime = (date.getTime() - today.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isUrgent = diffDays <= 7;

                            return (
                                <div key={check.id} className={`p-3 rounded-lg border text-sm transition-all hover:shadow-md ${isUrgent ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-white border-neutral-100 hover:border-neutral-300'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-neutral-800">{check.invoice_number}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'
                                            }`}>
                                            {new Date(check.check_due_date).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-xs text-neutral-500">
                                            {isUrgent ? (
                                                <span className="text-red-600 font-bold flex items-center gap-1">
                                                    ⏰ {diffDays} gün kaldı
                                                </span>
                                            ) : (
                                                <span>{diffDays} gün kaldı</span>
                                            )}
                                        </div>
                                        <div className="font-mono font-bold text-neutral-900 text-base">
                                            {Number(check.grand_total).toLocaleString('tr-TR')} ₺
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 bg-neutral-50 border-t text-right">
                    <span className="text-xs text-neutral-500 mr-2">Toplam (30 Gün):</span>
                    <span className="font-mono font-bold text-lg text-neutral-900">
                        {upcomingChecks.reduce((sum, c) => sum + Number(c.grand_total), 0).toLocaleString('tr-TR')} ₺
                    </span>
                </div>
            </Card>
        </div>
    );
}
