'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, Plus, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PREDEFINED_PRODUCTS = [
    'İnşaat Demiri', 'Hazır Beton', 'Tuğla', 'Çimento', 'Kum',
    'Çakıl', 'Kereste', 'Alçı', 'Boya', 'Seramik', 'Laminat'
];

const PREDEFINED_UNITS = [
    'Ton', 'm3', 'Adet', 'kg', 'Torba', 'm2', 'm', 'Paket'
];

const PREDEFINED_SUPPLIERS = [
    'Öztop', 'Shn', 'Canbek', 'Koparan', 'Camsan', 'Yiğit', 'Diğer'
];

export default function PriceEntryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<string>('');

    const [suppliers, setSuppliers] = useState<any[]>([]);

    useEffect(() => {
        fetchRequests();
        fetchSuppliers();
    }, []);

    const fetchRequests = async () => {
        const { data } = await supabase
            .from('purchase_requests')
            .select('*')
            .eq('status', 'Bekliyor')
            .order('created_at', { ascending: false });

        if (data) setPurchaseRequests(data);
    };

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('*');
        if (data) setSuppliers(data);
    };

    useEffect(() => {
        if (selectedRequest) {
            const req = purchaseRequests.find(r => r.id === selectedRequest);
            if (req) {
                setFormData(prev => ({
                    ...prev,
                    product_name: req.item_name || '',
                    // Try to guess detail or unit if possible, or leave blank
                    notes: `Talep Eden: ${req.requester || '-'} (${req.urgency})`,
                    // Linking logic
                    purchase_request_id: req.id
                }));
            }
        }
    }, [selectedRequest, purchaseRequests]);

    const [firmType, setFirmType] = useState<'tedarikci' | 'taseron'>('tedarikci');
    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        firm_name: '',
        contact_name: '',
        contact_phone: '',
        product_name: '',
        detail: '',
        unit: 'Adet',
        price: '',
        currency: 'TL',
        vat_rate: '20',
        includes_shipping: false,
        payment_terms: '',
        delivery_date: '',
        notes: '',
        purchase_request_id: null as string | null // Logic
    });

    // Auto-fill contact info when firm changes
    useEffect(() => {
        if (formData.firm_name) {
            const supplier = suppliers.find(s => s.name === formData.firm_name);
            if (supplier) {
                setFormData(prev => ({
                    ...prev,
                    contact_name: supplier.contact_name || prev.contact_name,
                    contact_phone: supplier.contact_phone || (supplier.phone || prev.contact_phone)
                }));
            }
        }
    }, [formData.firm_name, suppliers]);

    const handleSave = async (addAnother: boolean = false) => {
        if (!formData.firm_name || !formData.product_name || !formData.price) {
            toast.error('Lütfen zorunlu alanları doldurun (Firma, Ürün, Fiyat)');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price.replace(',', '.')), // Ensure number
                vat_rate: parseFloat(formData.vat_rate.toString().replace(',', '.'))
            };

            const { error } = await supabase
                .from('price_entries')
                .insert([payload]);

            if (error) throw error;

            toast.success('Fiyat kaydı eklendi ✅');

            if (addAnother) {
                // Reset minimal fields to speed up data entry
                setFormData(prev => ({
                    ...prev,
                    detail: '',
                    price: '',
                    notes: '',
                    contact_name: '', // Reset
                    contact_phone: '', // Reset
                    delivery_date: ''
                    // Keep firm, product, date, currency same for easier repetitive entry
                }));
            } else {
                router.push('/fiyat-karsilastirma');
            }
        } catch (error: any) {
            console.error('Save Error:', error);
            toast.error(`Kaydedilemedi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] p-4 gap-4">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800 tracking-tight">Yeni Fiyat Girişi</h1>
                    <p className="text-sm text-neutral-500">Piyasadan alınan fiyat tekliflerini buraya giriniz.</p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto w-full p-6 shadow-sm border-neutral-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Link to Purchase Request */}
                    <div className="col-span-1 md:col-span-2 space-y-2 bg-blue-50 p-4 rounded-md border border-blue-100">
                        <Label className="text-blue-700 font-bold">Açık Talep Seçimi (İsteğe Bağlı)</Label>
                        <Select
                            value={selectedRequest}
                            onValueChange={setSelectedRequest}
                        >
                            <SelectTrigger className="bg-white border-blue-200">
                                <SelectValue placeholder="Bir talep seçerek bilgileri otomatik doldur..." />
                            </SelectTrigger>
                            <SelectContent>
                                {purchaseRequests.length === 0 ? (
                                    <SelectItem value="none" disabled>Bekleyen talep bulunamadı</SelectItem>
                                ) : purchaseRequests.map(req => (
                                    <SelectItem key={req.id} value={req.id}>
                                        {req.item_name} - {req.quantity ? `${req.quantity} Adet` : ''} ({req.requester})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedRequest && (
                            <div className="text-xs text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedRequest('')}>
                                Seçimi Temizle
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <Label>Tarih</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    {/* Firm Type Toggle */}
                    <div className="col-span-1 md:col-span-2 flex gap-4 bg-gray-100 p-2 rounded-lg justify-center">
                        <div
                            className={`cursor-pointer px-4 py-2 rounded-md transition-all ${firmType === 'tedarikci' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFirmType('tedarikci')}
                        >
                            🏢 Malzeme Tedarikçisi
                        </div>
                        <div
                            className={`cursor-pointer px-4 py-2 rounded-md transition-all ${firmType === 'taseron' ? 'bg-white shadow text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setFirmType('taseron')}
                        >
                            👷 Taşeron / Hizmet
                        </div>
                    </div>

                    {/* Firm Name */}
                    <div className="space-y-2">
                        <Label>Firma / Tedarikçi</Label>
                        <SearchableSelect
                            options={suppliers
                                .filter(s => {
                                    if (firmType === 'tedarikci') return s.type === 'tedarikci' || s.type === 'ikisi';
                                    if (firmType === 'taseron') return s.type === 'taseron' || s.type === 'ikisi';
                                    return true;
                                })
                                .map(s => s.name)}
                            value={formData.firm_name}
                            onChange={v => setFormData({ ...formData, firm_name: v })}
                            placeholder={firmType === 'tedarikci' ? "Tedarikçi Seçiniz..." : "Taşeron Seçiniz..."}
                        />
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Firma Yetkilisi</Label>
                            <Input
                                placeholder="Örn: Ahmet Bey"
                                value={formData.contact_name}
                                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>İrtibat Numarası</Label>
                            <Input
                                placeholder="05XX..."
                                value={formData.contact_phone}
                                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Product */}
                    <div className="space-y-2">
                        <Label>Ürün / Malzeme</Label>
                        <SearchableSelect
                            options={PREDEFINED_PRODUCTS}
                            value={formData.product_name}
                            onChange={v => setFormData({ ...formData, product_name: v })}
                            placeholder="Ürün Grubu"
                        />
                    </div>

                    {/* Detail */}
                    <div className="space-y-2">
                        <Label>Detay / Özellik</Label>
                        <Input
                            placeholder="Örn: Ø12, C30, 13.5luk"
                            value={formData.detail}
                            onChange={e => setFormData({ ...formData, detail: e.target.value })}
                        />
                    </div>

                    {/* Price & Currency */}
                    <div className="space-y-2">
                        <Label>Birim Fiyat ({formData.currency})</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="flex-1 text-right font-mono font-bold text-lg"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                            <Select
                                value={formData.currency}
                                onValueChange={v => setFormData({ ...formData, currency: v })}
                            >
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TL">TL</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                        <Label>Birim</Label>
                        <SearchableSelect
                            options={PREDEFINED_UNITS}
                            value={formData.unit}
                            onChange={v => setFormData({ ...formData, unit: v })}
                            placeholder="Birim Seç"
                        />
                    </div>

                    {/* VAT */}
                    <div className="space-y-2">
                        <Label>KDV (%)</Label>
                        <Input
                            type="number"
                            value={formData.vat_rate}
                            onChange={e => setFormData({ ...formData, vat_rate: e.target.value })}
                        />
                    </div>

                    {/* Payment Terms */}
                    <div className="space-y-2">
                        <Label>Ödeme Şartı</Label>
                        <Input
                            placeholder="Peşin, 30 Gün, Çek..."
                            value={formData.payment_terms}
                            onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                        />
                    </div>

                    {/* Delivery Info */}
                    <div className="space-y-2">
                        <Label>Teslim Bilgisi</Label>
                        <Input
                            placeholder="Stoktan, 3 Gün Sonra..."
                            value={formData.delivery_date}
                            onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                        />
                    </div>

                    {/* Shipping Toggle */}
                    <div className="col-span-1 md:col-span-2 flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="shipping"
                            checked={formData.includes_shipping}
                            onCheckedChange={(c) => setFormData({ ...formData, includes_shipping: c === true })}
                        />
                        <Label htmlFor="shipping" className="cursor-pointer">
                            Nakliye Fiyata Dahil mi?
                        </Label>
                    </div>

                    {/* Notes */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>Notlar</Label>
                        <Textarea
                            placeholder="Ekstra şartlar, notlar..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button
                        className="flex-1 bg-neutral-800 hover:bg-neutral-900"
                        onClick={() => handleSave(false)}
                        disabled={loading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Kaydet ve Dön
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSave(true)}
                        disabled={loading}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Kaydet ve Yeni Ekle
                    </Button>
                </div>
            </Card>
        </div>
    );
}
