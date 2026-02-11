-- Add columns to iron_invoices table
ALTER TABLE iron_invoices ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'Malzeme Faturası';
ALTER TABLE iron_invoices ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'İnşaat Demiri';
