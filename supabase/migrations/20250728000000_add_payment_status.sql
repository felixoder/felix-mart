-- Add payment_status column to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_status TEXT DEFAULT 'pending';

-- Add comment to describe the column
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status: pending, paid, failed, refunded';

-- Create index for better query performance
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_status ON public.orders(status);
