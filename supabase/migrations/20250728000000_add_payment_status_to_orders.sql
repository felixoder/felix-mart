-- Add payment_status column to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_status TEXT DEFAULT 'pending';

-- Create an index for better performance
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Update existing orders with 'pending' payment status
UPDATE public.orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Add constraint to ensure valid payment statuses
ALTER TABLE public.orders 
ADD CONSTRAINT check_payment_status 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Add constraint to ensure valid order statuses  
ALTER TABLE public.orders 
ADD CONSTRAINT check_order_status 
CHECK (status IN ('pending', 'paid', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'));
