-- Add policy to allow users to update their own order status
-- This is needed for the OrderSuccess page to update order status after payment verification

-- First, let's add a more specific policy for users to update their own orders
CREATE POLICY "Users can update their own order status" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Or alternatively, we could modify the existing admin policy to also allow users to update their own orders
-- DROP POLICY "Admins can update orders" ON public.orders;
-- CREATE POLICY "Admins and users can update orders" ON public.orders
--   FOR UPDATE USING (
--     auth.uid() = user_id OR
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE profiles.id = auth.uid() AND profiles.is_admin = true
--     )
--   );
