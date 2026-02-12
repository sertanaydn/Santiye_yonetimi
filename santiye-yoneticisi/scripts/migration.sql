-- Add columns to iron_invoices table
ALTER TABLE iron_invoices ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'Malzeme Faturası';
ALTER TABLE iron_invoices ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'İnşaat Demiri';

-- Add columns to purchase_requests table (Feb 12, 2026)
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE purchase_requests ADD COLUMN IF NOT EXISTS description TEXT;
