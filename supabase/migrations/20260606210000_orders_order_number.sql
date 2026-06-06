-- Human-readable order reference used across portals (Shop, doctor queue, pharmacy).
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number)
  WHERE order_number IS NOT NULL;

UPDATE public.orders
SET order_number = 'ORD-' || UPPER(SUBSTRING(id::text FROM 1 FOR 8))
WHERE order_number IS NULL OR TRIM(order_number) = '';
