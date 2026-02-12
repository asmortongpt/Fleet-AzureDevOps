-- Add unit of measure to purchase order line items for workflow UI
ALTER TABLE purchase_order_line_items
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) DEFAULT 'EA';

UPDATE purchase_order_line_items
SET unit_of_measure = COALESCE(unit_of_measure, 'EA');
