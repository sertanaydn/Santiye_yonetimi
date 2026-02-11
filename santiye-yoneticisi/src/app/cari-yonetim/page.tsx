
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Calendar, CheckCircle, ChevronDown, ChevronRight, Circle, Download, Edit2,
    FileText, Link2, MoreHorizontal, Plus, RefreshCw,
    Search, Trash2, X, Check, CheckCircle2, Filter, Truck
} from "lucide-react";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const SUPPLIERS = [
    'Öztop', 'Shn', 'Canbek', 'Mini Kepçe', 'Ceper', 'Artı Yedi', 'Barış Vinç'
];

const FIRMS = [
    'Camsan', 'Koparan', 'Camsan&Koparan', 'Altın Raket'
];

const DISTRICTS = [
    'A-Blok', 'B-Blok', 'C-Blok', 'D-Blok', 'E-Blok', 'Şantiye',
    'A-B. Blok', 'B-E Blok', 'Satış Ofisi', 'E-C Blok', 'A-B-E Blok', 'B-C Blok', 'C-D Blok', 'A-B-D Blok'
];

const WORK_TYPES = [
    'Malzeme Faturası', 'Malzeme İrsaliyesi', 'İş Mak. Çalış. Faturası', 'İş Mak. Çalış. İrsaliyesi'
];

const MACHINES_AND_MATERIALS = [
    'Jcb', 'Vinç', 'Kamyon', 'Pompa', 'Malzeme', 'Mini Kepçe',
    'İnşaat Demiri', 'Beton', 'Ekskavatör', 'İş Makinesi', 'Bypass',
    'Makine', 'Hizmet'
];

const DETAILS = [
    // Iron
    'Ø8', 'Ø10', 'Ø12', 'Ø14', 'Ø16', 'Ø20',
    // Concrete
    'C30/37 HAZIR BETON', 'C30/37 (KATKISIZ) HAZIR BETON',
    'C35/45 HAZIR BETON', 'C35/45 (ANTİFRİZLİ) HAZIR BETON', 'C35/45 (BRÜT) HAZIR BETON',
    // Machinery & Others
    '47 METRELİK POMPA', '38 METRELİK POMPA', '2 No Mıcır', 'Latex',
    '210 Lastikli', '390 Paletli', '310 Paletli', '230 Paletli',
    '35 BKM 330', '35 AIY 929', '35 BKM 352', '35 ADA 655', '35 BCY 219',
    'KIRK AYAK', "BIMS 25'LİK BLOK", "BIMS 19'LUK BLOK", 'ÇİMENTO 50 KG', 'Kpç 42,5 Çimento', 'Kpç 32,5',
    'DİŞLİ KUM', 'KORUGE BORU 200 MM', "200'lük Drenaj Borusu", "200'lük Koruge Mansor",
    'Geo Tekstil Keçe', 'Ocaktan', 'Depodan', '25 Ton', 'Blokaj Malzemesi', 'Sarı su tutucu bant',
    '5 Tonluk'
].sort();

const UNITS = [
    'Kg.', 'Ton', 'Saat', 'Sefer', 'Yevmiye', 'Adet', 'Gr.', 'Mt.', 'M2', 'M3'
];

export default function CariYonetimPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [contracts, setContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);

    // Machine Logs State
    const [isMachineDialogOpen, setIsMachineDialogOpen] = useState(false);
    const [machineDetails, setMachineDetails] = useState({
        machine_name: '',
        operator_name: '',
        work_date: new Date().toISOString().split('T')[0],
        hours_worked: '',
        start_time: '',
        end_time: '',
        location_detail: '',
        notes: ''
    });

    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New Transaction State (Matching Excel Columns)
    const [newEntry, setNewEntry] = useState({
        status: 'BEKLİYOR',
        transaction_date: new Date().toISOString().split('T')[0],
        firm_name: 'Camsan', // Default
        supplier_name: '',
        document_no: '',
        district: 'Şantiye',
        work_type: 'Malzeme İrsaliyesi',
        description: '',
        category: 'Malzeme',
        detail: '',
        quantity: '',
        unit: 'Adet',
        unit_price: '',
        vat_rate: '20'
    });

    useEffect(() => {
        fetchTransactions();
        fetchContracts();
    }, []);

    async function fetchContracts() {
        // Fetch active contracts to link against
        const { data } = await supabase
            .from('contracts')
            .select('*')
            .eq('status', 'active');
        if (data) setContracts(data);
    }

    async function fetchTransactions() {
        setLoading(true);
        const { data, error } = await supabase
            .from('site_transactions')
            .select('*')
            .order('transaction_date', { ascending: false })
            .limit(50);

        if (error) {
            toast.error('Veriler yüklenirken hata oluştu');
        } else {
            setTransactions(data || []);
        }
        setLoading(false);
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ONAYLANDI' ? 'BEKLİYOR' : 'ONAYLANDI';

        // Optimistic UI Update
        setTransactions(transactions.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));

        const { error } = await supabase
            .from('site_transactions')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Status update failed:', error);
            toast.error('Durum güncellenemedi');
            // Revert on error
            setTransactions(transactions.map(t =>
                t.id === id ? { ...t, status: currentStatus } : t
            ));
        } else {
            if (newStatus === 'ONAYLANDI') {
                toast.success('İşlem Onaylandı ✅');
            }
        }
    };

    // Robust Number Parsing for Turkish Inputs (1.234,56 -> 1234.56)
    const parseAmount = (val: string) => {
        if (!val) return 0;
        // 1. Remove dots (thousand separators)
        // 2. Replace comma with dot (decimal separator)
        // 3. Remove non-numeric chars except dot and minus
        const clean = val.toString().replaceAll('.', '').replace(',', '.').replace(/[^0-9.-]/g, '');
        return parseFloat(clean) || 0;
    };

    const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

    // Helper to list transactions for a contract
    const getContractTransactions = (contractId: string) => {
        return transactions.filter(t => t.contract_id === contractId);
    };

    // Helper to update contract balance safely
    const updateContractBalance = async (contractId: string, quantityDelta: number) => {
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return;

        const newDelivered = parseFloat((contract.delivered_quantity || 0).toString()) + quantityDelta;

        const { error } = await supabase
            .from('contracts')
            .update({ delivered_quantity: newDelivered < 0 ? 0 : newDelivered })
            .eq('id', contractId);

        if (error) {
            console.error('Contract balance update failed', error);
            toast.error('Sözleşme bakiyesi güncellenemedi!');
        } else {
            // Update local state
            setContracts(prev => prev.map(c => c.id === contractId ? { ...c, delivered_quantity: newDelivered } : c));
        }
    };

    const handleSave = async () => {
        try {
            console.log("Starting Transaction Save...");
            setDebugInfo({ status: 'STARTING', step: 'Validation', mode: editingId ? 'UPDATE' : 'INSERT' });

            const quantity = parseAmount(newEntry.quantity);
            const unit_price = parseAmount(newEntry.unit_price);
            const vat_rate = parseAmount(newEntry.vat_rate) || 20;

            const amount = quantity * unit_price;
            const vat_amount = amount * (vat_rate / 100);
            const total_amount = amount + vat_amount;

            const payload: any = {
                ...newEntry,
                quantity,
                unit_price,
                amount,
                vat_amount,
                total_amount,
                company: 'Merkez',
                // Ensure text fields are never undefined
                supplier_name: newEntry.supplier_name || null,
                document_no: newEntry.document_no || null,
                firm_name: newEntry.firm_name || null,
                district: newEntry.district || null,
                work_type: newEntry.work_type || null,
                detail: newEntry.detail || null,
                // Ensure dates are valid
                transaction_date: newEntry.transaction_date || new Date().toISOString().split('T')[0],
            };

            // Prepare Final Machine Details
            const finalMachineDetails = { ...machineDetails };

            // Link Contract if selected
            if (selectedContract) {
                payload.contract_id = selectedContract.id;
            } else {
                // Explicitly clear contract if none selected
                payload.contract_id = null;
            }

            // Sync Quantity to Machine Hours if Machine Category
            const isMachineCategory = ['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine'].some(m => newEntry.category?.includes(m) || newEntry.description?.includes(m));

            if (isMachineCategory) {
                if (!finalMachineDetails.hours_worked && payload.quantity) {
                    finalMachineDetails.hours_worked = payload.quantity.toString();
                }
                // Ensure machine name fallback if missing
                if (!finalMachineDetails.machine_name) {
                    finalMachineDetails.machine_name = newEntry.category;
                }
            }

            console.log("Payload to Save:", payload);
            setDebugInfo({ status: 'SENDING_REQUEST', payload });

            let result;

            if (editingId) {
                // --- UPDATE LOGIC WITH CONTRACT SYNC ---
                const oldTransaction = transactions.find(t => t.id === editingId);

                result = await supabase
                    .from('site_transactions')
                    .update(payload)
                    .eq('id', editingId)
                    .select()
                    .single();

                if (!result.error && oldTransaction) {
                    const oldQty = parseFloat(oldTransaction.quantity || '0');
                    const newQty = quantity;
                    const oldContractId = oldTransaction.contract_id;
                    const newContractId = selectedContract?.id;

                    // 1. Same Contract, Quantity Changed
                    if (oldContractId && newContractId && oldContractId === newContractId) {
                        const diff = newQty - oldQty;
                        if (diff !== 0) await updateContractBalance(newContractId, diff);
                    }
                    // 2. Contract Switched (or Removed)
                    else {
                        // Refund Old
                        if (oldContractId) await updateContractBalance(oldContractId, -oldQty);
                        // Charge New
                        if (newContractId) await updateContractBalance(newContractId, newQty);
                    }
                }
            } else {
                // --- INSERT LOGIC WITH CONTRACT SYNC ---
                result = await supabase
                    .from('site_transactions')
                    .insert([payload])
                    .select()
                    .single();

                if (!result.error && selectedContract) {
                    await updateContractBalance(selectedContract.id, quantity);
                    toast.success(`Bağlantıdan düşüldü: ${quantity} ${newEntry.unit}`);
                }
            }

            if (result.error) {
                console.error('Supabase Error FULL:', JSON.stringify(result.error, null, 2));
                // Show technical message to user so they can report it
                const errorMsg = `HATA: ${result.error.message || result.error.code || 'Bilinmiyor'} (Detay: ${result.error.details || 'Yok'})`;
                toast.error(errorMsg);
                setDebugInfo({ status: 'ERROR', error: result.error, payload });
            } else {
                console.log("Success:", result.data);
                const data = result.data;   // --- MACHINE LOGS SAVE LOGIC ---

                // Save machine logs if details exist OR if it's a machine category (auto-create)
                if (finalMachineDetails.machine_name || finalMachineDetails.operator_name || isMachineCategory) {
                    const machinePayload = {
                        transaction_id: data.id,
                        ...finalMachineDetails
                    };

                    // Cleanup empty strings
                    Object.keys(machinePayload).forEach(key => {
                        if ((machinePayload as any)[key] === '') (machinePayload as any)[key] = null;
                    });

                    try {
                        // Use Secure RPC to bypass RLS
                        const rpcPayload = {
                            p_transaction_id: data.id,
                            p_machine_name: finalMachineDetails.machine_name,
                            p_operator_name: finalMachineDetails.operator_name,
                            p_work_date: finalMachineDetails.work_date || data.transaction_date,
                            p_hours_worked: Number(finalMachineDetails.hours_worked) || 0,
                            p_location_detail: finalMachineDetails.location_detail,
                            p_notes: finalMachineDetails.notes
                        };

                        const { error: rpcError } = await supabase.rpc('upsert_machine_log', rpcPayload);

                        if (rpcError) throw rpcError;

                    } catch (mErr: any) {
                        console.error("Machine Log Error:", mErr);
                        toast.error(`Makine detayı kaydedilemedi (RPC): ${mErr.message || 'Bilinmeyen Hata'}`);
                    }
                }

                toast.success(editingId ? 'Kayıt Güncellendi ✅' : 'Kayıt Eklendi ✅');

                if (editingId) {
                    setTransactions(transactions.map(t => t.id === editingId ? data : t));
                    setEditingId(null);
                } else {
                    setTransactions([data, ...transactions]);
                }

                setDebugInfo({ status: 'SUCCESS', data, payload });

                // Reset Fields (keep some defaults)
                setNewEntry({
                    status: 'BEKLİYOR',
                    transaction_date: new Date().toISOString().split('T')[0],
                    firm_name: 'Camsan',
                    supplier_name: '',
                    document_no: '',
                    district: 'Şantiye',
                    work_type: 'Malzeme İrsaliyesi',
                    description: '',
                    category: 'Malzeme',
                    detail: '',
                    quantity: '',
                    unit: 'Adet',
                    unit_price: '',
                    vat_rate: '20'
                });

                // Reset Machine Details
                setMachineDetails({
                    machine_name: '',
                    operator_name: '',
                    work_date: new Date().toISOString().split('T')[0],
                    hours_worked: '',
                    start_time: '',
                    end_time: '',
                    location_detail: '',
                    notes: ''
                });

                setSelectedContract(null); // Reset selection
                setDebugInfo(null);
            }
        } catch (err: any) {
            console.error("Client Side Error:", err);
            toast.error(`İstemci Hatası: ${err.message}`);
            setDebugInfo({ status: 'CLIENT_ERROR', error: err.message });
        }
    };

    const handleEdit = async (item: any) => {
        setEditingId(item.id);
        setNewEntry({
            ...item,
            // Ensure no null values for text inputs
            supplier_name: item.supplier_name || '',
            document_no: item.document_no || '',
            firm_name: item.firm_name || '',
            district: item.district || '',
            work_type: item.work_type || '',
            description: item.description || '',
            category: item.category || 'Malzeme',
            detail: item.detail || '',
            unit: item.unit || 'Adet',
            // Numbers to strings
            quantity: item.quantity?.toString() || '',
            unit_price: item.unit_price?.toString() || '',
            // Calculate VAT rate roughly if needed, or default to 20
            vat_rate: item.amount > 0 ? Math.round((item.vat_amount / item.amount) * 100).toString() : '20'
        });

        // Find existing contract if any
        if (item.contract_id) {
            const linked = contracts.find(c => c.id === item.contract_id);
            if (linked) setSelectedContract(linked);
        } else {
            setSelectedContract(null);
        }

        // --- MACHINE LOGS FETCH LOGIC ---
        // Fetch machine logs if exist
        const { data: log } = await supabase
            .from('machine_logs')
            .select('*')
            .eq('transaction_id', item.id)
            .maybeSingle();

        if (log) {
            setMachineDetails({
                machine_name: log.machine_name || '',
                operator_name: log.operator_name || '',
                work_date: log.work_date || item.transaction_date,
                hours_worked: log.hours_worked?.toString() || '',
                start_time: log.start_time || '',
                end_time: log.end_time || '',
                location_detail: log.location_detail || '',
                notes: log.notes || ''
            });
            // Auto open dialog if it's a machine type to show user
            if (['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi'].some(m => item.category?.includes(m))) {
                // Optional: setIsMachineDialogOpen(true); // Don't auto open, just load data
                toast.info("Makine detayları yüklendi.");
            }
        } else {
            // Reset if no log found
            setMachineDetails({
                machine_name: '',
                operator_name: '',
                work_date: new Date().toISOString().split('T')[0],
                hours_worked: '',
                start_time: '',
                end_time: '',
                location_detail: '',
                notes: ''
            });
        }

        toast.info("Düzenleme modu aktif. Veriler yukarı taşındı.");
        // Scroll to top
        const topElement = document.getElementById('input-row');
        if (topElement) topElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewEntry({
            status: 'BEKLİYOR',
            transaction_date: new Date().toISOString().split('T')[0],
            firm_name: 'Camsan',
            supplier_name: '',
            document_no: '',
            district: 'Şantiye',
            work_type: 'Malzeme İrsaliyesi',
            description: '',
            category: 'Malzeme',
            detail: '',
            quantity: '',
            unit: 'Adet',
            unit_price: '',
            vat_rate: '20'
        });
        setSelectedContract(null); // Reset selection
        toast.info("Düzenleme iptal edildi.");
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

        // 1. Get the transaction details first to check for contract linkage
        // We can use the local state if accurate, or fetch from DB to be safe. 
        // Using local state is faster and sufficient here since we just loaded it.
        const transaction = transactions.find(t => t.id === id);

        if (transaction && transaction.contract_id) {
            console.log("Deleting linked transaction. Restoring contract balance...", transaction.contract_id);

            // Fetch current contract to get latest delivered_amount
            const { data: contract, error: fetchErr } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', transaction.contract_id)
                .single();

            if (contract && !fetchErr) {
                const newDelivered = parseFloat(contract.delivered_quantity || 0) - parseFloat(transaction.quantity || 0);

                // Update Contract
                const { error: updateErr } = await supabase
                    .from('contracts')
                    .update({ delivered_quantity: newDelivered < 0 ? 0 : newDelivered }) // Prevent negative just in case
                    .eq('id', transaction.contract_id);

                if (updateErr) {
                    console.error("Failed to restore contract balance:", updateErr);
                    toast.error("Bağlantı bakiyesi güncellenemedi!");
                } else {
                    // Update local contracts state
                    setContracts(contracts.map(c => c.id === transaction.contract_id ? { ...c, delivered_quantity: newDelivered } : c));
                    toast.info("Bağlantı bakiyesi geri yüklendi.");
                }
            }
        }

        const { error } = await supabase.from('site_transactions').delete().eq('id', id);

        if (error) {
            toast.error(`Silinemedi: ${error.message}`);
        } else {
            toast.success('Kayıt silindi 🗑️');
            setTransactions(transactions.filter(t => t.id !== id));
        }
    };

    // Helper for formatting inputs as Turkish Currency (1.234,56)
    const handleNumberChange = (field: string, value: string) => {
        // Allow: numbers, comma, dot
        if (!/^[0-9.,]*$/.test(value)) return;

        // Remove existing dots to re-format
        let clean = value.replaceAll('.', '');

        // Prevent multiple commas
        const parts = clean.split(',');
        if (parts.length > 2) return;

        // Format integer part with dots
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

        const formatted = parts.join(',');
        setNewEntry({ ...newEntry, [field]: formatted });
    };

    // Calculate dynamic values for input row
    const currentAmount = parseAmount(newEntry.quantity) * parseAmount(newEntry.unit_price);
    const currentVat = currentAmount * ((parseAmount(newEntry.vat_rate) || 20) / 100);
    const currentTotal = currentAmount + currentVat;

    const [isManageContractsOpen, setIsManageContractsOpen] = useState(false);

    // ... (existing functions)

    const handleDeleteContract = async (id: string) => {
        if (!confirm('Bu bağlantıyı silmek istediğinize emin misiniz? (Bağlı işlemler etkilenmeyecektir ancak takip kopabilir)')) return;

        const { error } = await supabase.from('contracts').delete().eq('id', id);

        if (error) {
            toast.error(`Silinemedi: ${error.message}`);
        } else {
            toast.success('Bağlantı silindi 🗑️');
            setContracts(contracts.filter(c => c.id !== id));
            // Also clear selection if deleted
            if (selectedContract?.id === id) setSelectedContract(null);
        }
    };

    const togglePaymentStatus = async (id: string, currentStatus: string) => {
        const nextStatus = {
            'Ödenmedi': 'Ödendi',
            'Ödendi': 'Kısmi',
            'Kısmi': 'Ödenmedi'
        }[currentStatus] || 'Ödendi';

        // Optimistic UI Update
        setTransactions(transactions.map(t =>
            t.id === id ? { ...t, payment_status: nextStatus } : t
        ));

        const { error } = await supabase
            .from('site_transactions')
            .update({ payment_status: nextStatus })
            .eq('id', id);

        if (error) {
            console.error("Payment Status Error:", error);
            toast.error("Ödeme durumu güncellenemedi");
            // Revert
            setTransactions(transactions.map(t =>
                t.id === id ? { ...t, payment_status: currentStatus } : t
            ));
        } else {
            toast.success(`Ödeme Durumu: ${nextStatus}`);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa]">
            <PageHeader title="Cari Yönetim 2026" subtitle="AKILLI İŞLEM DEFTERİ" />

            <div className="flex-1 p-4 overflow-hidden flex flex-col">

                {/* Control Bar */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 bg-white p-1 rounded border shadow-sm w-96">
                        <Search className="w-4 h-4 text-gray-400 ml-2" />
                        <Input
                            placeholder="Ara..."
                            className="border-none h-8 focus-visible:ring-0"
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Manager Contracts Button */}
                        <Dialog open={isManageContractsOpen} onOpenChange={setIsManageContractsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2 border-purple-200 hover:bg-purple-50 text-purple-700">
                                    <Link2 className="w-4 h-4" /> Bağlantıları Yönet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Mevcut Bağlantılar (Sözleşmeler)</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tedarikçi</TableHead>
                                                <TableHead>Malzeme</TableHead>
                                                <TableHead className="text-right">Toplam</TableHead>
                                                <TableHead className="text-right">Teslim Edilen</TableHead>
                                                <TableHead className="text-right">Kalan</TableHead>
                                                <TableHead className="text-right">Birim Fiyat</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {contracts.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-neutral-500">Hiç bağlantı bulunamadı.</TableCell>
                                                </TableRow>
                                            ) : contracts.map(c => (
                                                <React.Fragment key={c.id}>
                                                    <TableRow className={expandedContractId === c.id ? "bg-purple-50" : ""}>
                                                        <TableCell className="w-[30px]">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedContractId(expandedContractId === c.id ? null : c.id)}>
                                                                {expandedContractId === c.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell className="font-medium">{c.supplier}</TableCell>
                                                        <TableCell>{c.material_group}</TableCell>
                                                        <TableCell className="text-right font-mono">{Number(c.total_quantity).toLocaleString('tr-TR')} {c.unit}</TableCell>
                                                        <TableCell className="text-right font-mono text-neutral-600">{Number(c.delivered_quantity).toLocaleString('tr-TR')} {c.unit}</TableCell>
                                                        <TableCell className="text-right font-mono font-bold">{Number(c.remaining_quantity).toLocaleString('tr-TR')} {c.unit}</TableCell>
                                                        <TableCell className="text-right font-mono">{Number(c.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDeleteContract(c.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                    {expandedContractId === c.id && (
                                                        <TableRow className="bg-purple-50/50">
                                                            <TableCell colSpan={8} className="p-4">
                                                                <div className="bg-white rounded border p-2">
                                                                    <div className="text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wide">İşlem Geçmişi (Bu Bağlantıdan Düşülenler)</div>
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow className="h-8 border-none bg-neutral-100">
                                                                                <TableHead className="h-8 text-xs">Tarih</TableHead>
                                                                                <TableHead className="h-8 text-xs">Açıklama</TableHead>
                                                                                <TableHead className="h-8 text-xs text-right">Miktar</TableHead>
                                                                                <TableHead className="h-8 text-xs text-right">Tutar</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {getContractTransactions(c.id).length === 0 ? (
                                                                                <TableRow>
                                                                                    <TableCell colSpan={4} className="text-center text-xs text-neutral-400 py-2">Henüz işlem yapılmamış.</TableCell>
                                                                                </TableRow>
                                                                            ) : getContractTransactions(c.id).map(t => (
                                                                                <TableRow key={t.id} className="h-8 border-none hover:bg-neutral-50">
                                                                                    <TableCell className="text-xs py-1">{new Date(t.transaction_date).toLocaleDateString('tr-TR')}</TableCell>
                                                                                    <TableCell className="text-xs py-1">{t.description || '-'}</TableCell>
                                                                                    <TableCell className="text-xs py-1 text-right font-mono">{Number(t.quantity).toLocaleString('tr-TR')} {t.unit}</TableCell>
                                                                                    <TableCell className="text-xs py-1 text-right font-mono">{Number(t.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm" className="gap-2" onClick={fetchTransactions}>
                            <RefreshCw className="w-4 h-4" /> Yenile
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" /> Excel
                        </Button>
                    </div>
                </div>

                {/* Main Data Grid (Excel Style) */}
                <Card className="flex-1 overflow-auto border-neutral-200 shadow-sm rounded-sm bg-white">
                    <Table>
                        <TableHeader className="bg-neutral-100 sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700">ONAY</TableHead>
                                <TableHead className="w-[110px] text-xs font-bold text-neutral-700">TARİH</TableHead>
                                <TableHead className="w-[140px] text-xs font-bold text-neutral-700">FİRMA</TableHead>
                                <TableHead className="w-[140px] text-xs font-bold text-neutral-700">TEDARİKÇİ</TableHead>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700">İRSALİYE NO</TableHead>
                                <TableHead className="w-[120px] text-xs font-bold text-neutral-700">MAHAL</TableHead>
                                <TableHead className="w-[160px] text-xs font-bold text-neutral-700">İMALAT TÜRÜ</TableHead>
                                <TableHead className="min-w-[150px] text-xs font-bold text-neutral-700">AÇIKLAMA</TableHead>
                                <TableHead className="w-[140px] text-xs font-bold text-neutral-700">MAKİNE / MALZEME</TableHead>
                                <TableHead className="min-w-[120px] text-xs font-bold text-neutral-700">DETAY</TableHead>
                                <TableHead className="w-[80px] text-xs font-bold text-neutral-700 text-right">MİKTAR</TableHead>
                                <TableHead className="w-[90px] text-xs font-bold text-neutral-700">BİRİM</TableHead>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700 text-right">BİRİM FİYATI</TableHead>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700 text-right">TUTAR</TableHead>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700 text-right">KDV</TableHead>
                                <TableHead className="w-[110px] text-xs font-bold text-neutral-700 text-right">TOPLAM</TableHead>
                                <TableHead className="w-[100px] text-xs font-bold text-neutral-700 text-center">ÖDEME</TableHead>
                                <TableHead className="w-[80px] text-xs font-bold text-center">İŞLEM</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>

                            {/* Input Row (Quick Add / Edit) */}
                            <TableRow id="input-row" className={`${editingId ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50/50 hover:bg-blue-50 border-blue-100'} border-b-2 sticky top-10 z-20`}>
                                <TableCell className="p-1 text-center">
                                    <div className="flex justify-center items-center h-7 w-full text-neutral-300">
                                        <Circle className="w-4 h-4" />
                                    </div>
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input type="date" className="h-7 text-xs bg-white px-1" value={newEntry.transaction_date} onChange={(e) => setNewEntry({ ...newEntry, transaction_date: e.target.value })} />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={FIRMS}
                                        value={newEntry.firm_name}
                                        onChange={(v) => setNewEntry({ ...newEntry, firm_name: v })}
                                        placeholder="Firma"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={SUPPLIERS}
                                        value={newEntry.supplier_name}
                                        onChange={(v) => setNewEntry({ ...newEntry, supplier_name: v })}
                                        placeholder="Tedarikçi"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input placeholder="No" className="h-7 text-xs bg-white px-1" value={newEntry.document_no} onChange={(e) => setNewEntry({ ...newEntry, document_no: e.target.value })} />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={DISTRICTS}
                                        value={newEntry.district}
                                        onChange={(v) => setNewEntry({ ...newEntry, district: v })}
                                        placeholder="Mahal"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={WORK_TYPES}
                                        value={newEntry.work_type}
                                        onChange={(v) => setNewEntry({ ...newEntry, work_type: v })}
                                        placeholder="İmalat"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input placeholder="Açıklama" className="h-7 text-xs bg-white px-1" value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={MACHINES_AND_MATERIALS}
                                        value={newEntry.category}
                                        onChange={(v) => {
                                            // Handle Auto-VAT Logic
                                            const isIron = v === 'İnşaat Demiri';
                                            setNewEntry({
                                                ...newEntry,
                                                category: v,
                                                vat_rate: isIron ? '10' : '20'
                                            });
                                            if (isIron) {
                                                toast.info('KDV oranı otomatik olarak %10 (Tevkifatlı) ayarlandı. Bağlantı seçebilirsiniz.');
                                            }
                                        }}
                                        placeholder="Tür"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={DETAILS}
                                        value={newEntry.detail}
                                        onChange={(v) => setNewEntry({ ...newEntry, detail: v })}
                                        placeholder="Detay"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input
                                        type="text"
                                        placeholder="0"
                                        className="h-7 text-xs bg-white text-right px-1"
                                        value={newEntry.quantity}
                                        onChange={(e) => handleNumberChange('quantity', e.target.value)}
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <SearchableSelect
                                        options={UNITS}
                                        value={newEntry.unit}
                                        onChange={(v) => setNewEntry({ ...newEntry, unit: v })}
                                        placeholder="Birim"
                                        className="h-7 text-xs bg-white"
                                    />
                                </TableCell>
                                <TableCell className="p-1">
                                    <Input
                                        type="text"
                                        placeholder="0,00"
                                        className="h-7 text-xs bg-white text-right px-1"
                                        value={newEntry.unit_price}
                                        onChange={(e) => handleNumberChange('unit_price', e.target.value)}
                                    />
                                </TableCell>
                                {/* Auto-Calculated Columns (Read Only Preview) */}
                                <TableCell className="text-right text-xs font-mono p-1 align-middle text-neutral-500">
                                    {currentAmount > 0 ? currentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-xs font-mono p-1 align-middle text-neutral-500">
                                    {currentVat > 0 ? currentVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                </TableCell>
                                <TableCell className="text-right text-xs font-mono p-1 align-middle text-neutral-900 font-bold">
                                    {currentTotal > 0 ? currentTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                                </TableCell>
                                <TableCell className="p-1 text-center">
                                    <span className="text-xs text-neutral-400 select-none">-</span>
                                </TableCell>
                                <TableCell className="p-1 flex items-center justify-center gap-1">

                                    {/* Link to Contract Button (Only for Iron) */}
                                    {newEntry.category === 'İnşaat Demiri' && !editingId && (
                                        <Dialog open={isContractDialogOpen} onOpenChange={setIsContractDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    className={`h-7 w-7 rounded-sm ${selectedContract ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                                                    title={selectedContract ? `Seçili: ${selectedContract.supplier}` : 'Bağlantıdan Düş'}
                                                >
                                                    <Link2 className="w-4 h-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Sözleşme / Bağlantı Seç</DialogTitle>
                                                </DialogHeader>
                                                <div className="py-2 space-y-2">
                                                    {contracts.length === 0 ? (
                                                        <div className="text-neutral-500 text-sm">Hiç aktif bağlantı bulunamadı.</div>
                                                    ) : contracts.map(c => (
                                                        <div
                                                            key={c.id}
                                                            className={`p-3 border rounded cursor-pointer hover:bg-neutral-50 flex justify-between items-center ${selectedContract?.id === c.id ? 'border-green-500 bg-green-50' : ''}`}
                                                            onClick={() => {
                                                                setSelectedContract(c);
                                                                setIsContractDialogOpen(false);
                                                                // Auto-fill price if needed
                                                                if (c.unit_price) {
                                                                    // Format as 1.234,56
                                                                    const formattedPrice = Number(c.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                    setNewEntry({ ...newEntry, unit_price: formattedPrice, supplier_name: c.supplier });
                                                                    toast.success("Birim fiyat ve tedarikçi güncellendi.");
                                                                }
                                                            }}
                                                        >
                                                            <div>
                                                                <div className="font-bold">{c.supplier}</div>
                                                                <div className="text-sm text-neutral-600">{c.material_group}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-mono text-sm">{c.remaining_quantity} {c.unit} Kaldı</div>
                                                                <div className="text-xs text-neutral-500">{c.unit_price} TL</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => { setSelectedContract(null); setIsContractDialogOpen(false); }}>Seçimi Kaldır</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {/* Machine Details Button (For Machinery) */}
                                    {['Jcb', 'Vinç', 'Kamyon', 'Mini Kepçe', 'Ekskavatör', 'İş Makinesi', 'Makine', 'Hizmet'].some(m => newEntry.category?.includes(m) || newEntry.description?.includes(m)) && (
                                        <Dialog open={isMachineDialogOpen} onOpenChange={setIsMachineDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    className={`h-7 w-7 rounded-sm ${machineDetails.operator_name ? 'bg-orange-600 hover:bg-orange-700' : 'bg-neutral-600 hover:bg-neutral-700'}`}
                                                    title={machineDetails.operator_name ? `Operatör: ${machineDetails.operator_name}` : 'Makine Detayı Ekle'}
                                                >
                                                    <Truck className="w-4 h-4 text-white" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-[425px] sm:max-w-[600px]">
                                                <DialogHeader>
                                                    <DialogTitle>Makine Çalışma Detayları</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>Makine Adı / Plaka</Label>
                                                            <Input
                                                                value={machineDetails.machine_name}
                                                                onChange={e => setMachineDetails({ ...machineDetails, machine_name: e.target.value })}
                                                                placeholder="Örn: 34 ABC 123"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Operatör Adı</Label>
                                                            <Input
                                                                value={machineDetails.operator_name}
                                                                onChange={e => setMachineDetails({ ...machineDetails, operator_name: e.target.value })}
                                                                placeholder="Örn: Ahmet Yılmaz"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={() => setIsMachineDialogOpen(false)}>Kaydet ve Kapat</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {editingId ? (
                                        <>
                                            <Button size="icon" onClick={handleSave} className="h-7 w-7 bg-green-600 hover:bg-green-700 rounded-sm">
                                                <Check className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" onClick={handleCancelEdit} className="h-7 w-7 bg-neutral-400 hover:bg-neutral-500 rounded-sm">
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="icon" onClick={handleSave} className="h-7 w-7 bg-blue-600 hover:bg-blue-700 rounded-sm">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>

                            {/* Data Rows */}
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={17} className="text-center h-24">Yükleniyor...</TableCell>
                                </TableRow>
                            ) : transactions.map((t) => (
                                <TableRow key={t.id} className={`group hover:bg-neutral-50 h-8 border-b border-neutral-100 ${editingId === t.id ? 'bg-yellow-50/50' : ''}`}>
                                    <TableCell className="p-1 text-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`h-6 w-6 hover:bg-transparent ${t.status === 'ONAYLANDI' ? 'text-green-600 hover:text-green-700' : 'text-neutral-300 hover:text-neutral-500'}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent row click edit
                                                handleToggleStatus(t.id, t.status);
                                            }}
                                            title={t.status === 'ONAYLANDI' ? 'Onayı Kaldır' : 'Onayla'}
                                        >
                                            {t.status === 'ONAYLANDI' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-600 truncate">{new Date(t.transaction_date).toLocaleDateString('tr-TR')}</TableCell>
                                    <TableCell className="p-1 text-xs font-medium text-neutral-800 truncate">{t.firm_name}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-600 truncate">{t.supplier_name}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-500 font-mono truncate">{t.document_no}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-600 truncate">{t.district}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-600 truncate">{t.work_type}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-800 truncate font-medium">{t.description}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-500 truncate">{t.category}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-500 truncate">{t.detail}</TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-900 text-right">{Number(t.quantity).toLocaleString('tr-TR')}</TableCell>
                                    <TableCell className="p-1 text-xs text-neutral-500">{t.unit}</TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-600 text-right">{Number(t.unit_price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-600 text-right">{Number(t.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-500 text-right">{Number(t.vat_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="p-1 text-xs font-mono text-neutral-900 font-bold text-right">{Number(t.total_amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                                    <TableCell className="p-1 text-center">
                                        <Badge
                                            variant="outline"
                                            className={`cursor-pointer select-none text-[10px] px-2 py-0.5 w-[80px] justify-center ${t.payment_status === 'Ödendi' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' :
                                                t.payment_status === 'Kısmi' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' :
                                                    'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePaymentStatus(t.id, t.payment_status || 'Ödenmedi');
                                            }}
                                        >
                                            {t.payment_status || 'Ödenmedi'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="p-1 text-center flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-blue-600" onClick={() => handleEdit(t)}>
                                            <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600" onClick={() => handleDelete(t.id)}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>


            </div>
        </div>
    );
}
