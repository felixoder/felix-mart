import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

interface OrderDetails {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image_url: string;
    };
  }>;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'cancelled' | 'pending'>('pending');
  const { toast } = useToast();

  const orderId = searchParams.get('order_id');
  const paymentSessionId = searchParams.get('payment_session_id');
  const cashfreeStatus = searchParams.get('status'); // Cashfree might add status parameter
  const orderStatus = searchParams.get('order_status'); // Another possible parameter
  const forceCancelled = searchParams.get('cancelled'); // Manual override for testing

  useEffect(() => {
    // Debug: Log all URL parameters
    console.log('🔍 OrderSuccess URL Parameters:');
    console.log('orderId:', orderId);
    console.log('paymentSessionId:', paymentSessionId);
    console.log('cashfreeStatus:', cashfreeStatus);
    console.log('orderStatus:', orderStatus);
    console.log('forceCancelled:', forceCancelled);
    console.log('All search params:', Object.fromEntries(searchParams.entries()));

    // Check for manual override (for testing)
    if (forceCancelled === 'true') {
      console.log('🧪 Manual cancellation override detected');
      setPaymentStatus('cancelled');
      setLoading(false);
      return;
    }

    // Check if we have clear cancellation indicators in the URL
    if (cashfreeStatus === 'CANCELLED' || cashfreeStatus === 'FAILED' || 
        orderStatus === 'CANCELLED' || orderStatus === 'FAILED') {
      console.log('🚫 Detected cancellation from URL parameters');
      setPaymentStatus('cancelled');
      setLoading(false);
      return;
    }

    if (orderId) {
      verifyPaymentAndFetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId, cashfreeStatus, orderStatus, forceCancelled]);

  const verifyPaymentAndFetchOrder = async () => {
    try {
      // First, verify payment status with Cashfree
      if (paymentSessionId) {
        // Use local server for development, Supabase functions for production
        const isLocalDev = window.location.hostname === 'localhost';
        const apiBaseUrl = isLocalDev 
          ? "http://localhost:3001" 
          : "https://kwsqhrqhtcuacfvmxwji.supabase.co";
          
        // For testing purposes, you can use the debug endpoint by adding ?debug=true to the URL
        const useDebugEndpoint = new URLSearchParams(window.location.search).get('debug') === 'true';
        const endpoint = useDebugEndpoint 
          ? '/debug/verify-payment'
          : '/functions/v1/verify-payment';
          
        console.log(`Using endpoint: ${apiBaseUrl}${endpoint}`);
        
        const response = await fetch(
          `${apiBaseUrl}${endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(isLocalDev ? {} : { 
                "Authorization": `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3FocnFodGN1YWNmdm14d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDEyNTgsImV4cCI6MjA2OTExNzI1OH0.w677z2scEUSeLvsVqA3pPBUx0TihKB3LP1QuedLgqvQ` 
              }),
            },
            body: JSON.stringify({
              payment_session_id: paymentSessionId,
              order_id: orderId,
            }),
          }
        );

        if (response.ok) {
          const paymentData = await response.json();
          console.log('🔍 Payment verification response:', paymentData);
          console.log('🔍 Order ID being verified:', orderId);
          console.log('🔍 Payment Session ID:', paymentSessionId);
          
          // Check for various success indicators from Cashfree
          // Be more strict - only consider PAID as successful
          const isPaid = paymentData.order_status === 'PAID' && 
                        (paymentData.payment_status === 'SUCCESS' || !paymentData.payment_status);
          
          // Check for cancellation/failure indicators  
          const isCancelled = paymentData.order_status === 'CANCELLED' ||
                             paymentData.payment_status === 'CANCELLED' ||
                             paymentData.order_status === 'FAILED' ||
                             paymentData.payment_status === 'FAILED' ||
                             paymentData.order_status === 'EXPIRED' ||
                             paymentData.payment_status === 'USER_DROPPED' ||
                             paymentData.order_status === 'TERMINATED' ||
                             paymentData.payment_status === 'TERMINATED';
          
          // Check if order exists but no payment was made (likely cancellation)
          const isUnpaid = paymentData.order_status === 'CREATED' || 
                          paymentData.order_status === 'PENDING' ||
                          paymentData.order_status === 'ACTIVE' ||
                          paymentData.payment_status === 'PENDING' ||
                          (!paymentData.payment_status && paymentData.order_status !== 'PAID') ||
                          (!paymentData.order_status);
          
          console.log('🔍 Is payment successful?', isPaid);
          console.log('🔍 Is payment cancelled/failed?', isCancelled);
          console.log('🔍 Is payment unpaid (likely cancelled)?', isUnpaid);
          console.log('🔍 Order status from Cashfree:', paymentData.order_status);
          console.log('🔍 Payment status from Cashfree:', paymentData.payment_status);
          console.log('🔍 Raw payment data:', JSON.stringify(paymentData, null, 2));
          
          if (isPaid) {
            console.log('✅ Payment is successful, updating order status...');
            setPaymentStatus('success');
            
            // Update order status in database to 'paid'
            console.log('🔄 Attempting to update order status to "paid" for order:', orderId);
            
            try {
              // Try direct database update first (this should work now with proper RLS policy)
              console.log('🔄 Trying direct database update...');
              const { data: updateData, error: dbError } = await supabase
                .from("orders")
                .update({ status: "paid" })
                .eq("id", orderId)
                .select();
                
              console.log('🔍 Direct update result:', { updateData, dbError });
              
              if (dbError) {
                console.error("❌ Direct database update failed:", dbError);
                
                // Fallback: try the API endpoint
                console.log('🔄 Trying API endpoint as fallback...');
                const isLocalDev = window.location.hostname === 'localhost';
                const updateResponse = await fetch(
                  `${isLocalDev ? 'http://localhost:3001' : 'https://kwsqhrqhtcuacfvmxwji.supabase.co'}/functions/v1/update-order-status`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(isLocalDev ? {} : { 
                        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3FocnFodGN1YWNmdm14d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDEyNTgsImV4cCI6MjA2OTExNzI1OH0.w677z2scEUSeLvsVqA3pPBUx0TihKB3LP1QuedLgqvQ` 
                      }),
                    },
                    body: JSON.stringify({
                      order_id: orderId,
                      status: 'paid'
                    })
                  }
                );
                
                if (updateResponse.ok) {
                  const updateResult = await updateResponse.json();
                  console.log('✅ Order status updated via API fallback:', updateResult);
                  toast({
                    title: "Success",
                    description: "Payment verified and order status updated to PAID (via API)",
                  });
                } else {
                  const updateError = await updateResponse.json();
                  console.error('❌ API fallback also failed:', updateError);
                  toast({
                    title: "Warning",
                    description: `Payment verified but failed to update order status: ${updateError.details || updateError.error}`,
                    variant: "destructive",
                  });
                }
              } else {
                console.log("✅ Direct database update succeeded:", updateData);
                console.log("📊 Rows updated:", updateData ? updateData.length : 0);
                toast({
                  title: "Success",
                  description: "Payment verified and order status updated to PAID",
                });
              }
            } catch (error) {
              console.error('❌ Update process failed completely:', error);
              toast({
                title: "Error",
                description: `Payment verified but failed to update order status: ${error.message}`,
                variant: "destructive",
              });
            }
          } else if (isCancelled) {
            console.log('❌ Payment was cancelled by user');
            setPaymentStatus('cancelled');
            
            // Update order status to cancelled in database
            const { error: updateError } = await supabase
              .from("orders")
              .update({ 
                status: "cancelled"
              })
              .eq("id", orderId);
              
            if (updateError) {
              console.error("Error updating order status to cancelled:", updateError);
            } else {
              console.log("Order status updated to cancelled");
              toast({
                title: "Payment Cancelled",
                description: "Your payment was cancelled. The order has been marked as cancelled.",
                variant: "destructive",
              });
            }
          } else if (isUnpaid) {
            console.log('🚫 Payment appears to be unpaid (likely cancelled)');
            setPaymentStatus('cancelled');
            
            // Update order status to cancelled in database
            const { error: updateError } = await supabase
              .from("orders")
              .update({ 
                status: "cancelled"
              })
              .eq("id", orderId);
              
            if (updateError) {
              console.error("Error updating order status to cancelled:", updateError);
            } else {
              console.log("Order status updated to cancelled (unpaid)");
              toast({
                title: "Payment Cancelled",
                description: "No payment was completed. The order has been cancelled.",
                variant: "destructive",
              });
            }
          } else {
            // If not explicitly paid, cancelled, or unpaid, treat as cancelled in development
            const isDevelopment = window.location.hostname === 'localhost';
            console.log('❌ Payment status unclear, treating as cancelled');
            console.log('🔍 Development mode:', isDevelopment);
            
            setPaymentStatus('cancelled');
            
            // Update order status to cancelled in database
            const { error: updateError } = await supabase
              .from("orders")
              .update({ 
                status: "cancelled"
              })
              .eq("id", orderId);
              
            if (updateError) {
              console.error("Error updating order status to cancelled:", updateError);
            } else {
              console.log("Order status updated to cancelled (unclear status)");
              toast({
                title: "Payment Cancelled",
                description: isDevelopment 
                  ? "Payment status unclear - treated as cancelled in development"
                  : "Payment was not completed successfully",
                variant: "destructive",
              });
            }
          }
        } else {
          console.log('❌ Payment verification failed or no response');
          
          // In development, if payment verification fails, assume cancellation
          const isDevelopment = window.location.hostname === 'localhost';
          if (isDevelopment) {
            console.log('🧪 Development mode: treating failed verification as cancellation');
            setPaymentStatus('cancelled');
            
            // Update order status to cancelled in database
            const { error: updateError } = await supabase
              .from("orders")
              .update({ 
                status: "cancelled"
              })
              .eq("id", orderId);
              
            if (updateError) {
              console.error("Error updating order status to cancelled:", updateError);
            } else {
              console.log("Order status updated to cancelled (dev mode)");
            }
          } else {
            setPaymentStatus('failed');
          }
        }
      }

      // Fetch order details
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = {
        ...data,
        order_items: data.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: item.products
        }))
      };

      setOrderDetails(transformedData);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to fetch order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={null} cartItemsCount={0} onCartClick={() => {}} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orderId || !orderDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={null} cartItemsCount={0} onCartClick={() => {}} />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-4">
                We couldn't find the order details. Please check your email for order confirmation.
              </p>
              <Button asChild>
                <Link to="/">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} cartItemsCount={0} onCartClick={() => {}} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          {paymentStatus === 'success' ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
              <p className="text-muted-foreground">Thank you for your purchase. Your order has been confirmed.</p>
            </>
          ) : paymentStatus === 'cancelled' ? (
            <>
              <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-orange-600 mb-2">Payment Cancelled</h1>
              <p className="text-muted-foreground">You cancelled the payment process. Your order has been cancelled and no charges were made.</p>
            </>
          ) : paymentStatus === 'failed' ? (
            <>
              <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-destructive mb-2">Payment Failed</h1>
              <p className="text-muted-foreground">There was an issue processing your payment. Please try again.</p>
            </>
          ) : (
            <>
              <Package className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Order Placed</h1>
              <p className="text-muted-foreground">Your order has been placed and is being processed.</p>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Order ID:</span>
              <span className="font-mono text-sm">{orderDetails.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Order Date:</span>
              <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Order Status:</span>
              <span className="capitalize">{orderDetails.status}</span>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Items Ordered:</h3>
              <div className="space-y-3">
                {orderDetails.order_items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <img
                      src={item.product.image_url || "/placeholder.svg"}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <p className="font-medium">₹{(item.quantity * item.price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>₹{orderDetails.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-x-4">
          {paymentStatus === 'cancelled' ? (
            <>
              <Button asChild variant="outline">
                <Link to="/">Continue Shopping</Link>
              </Button>
              <Button asChild>
                <Link to="/checkout">Try Payment Again</Link>
              </Button>
            </>
          ) : paymentStatus === 'failed' ? (
            <>
              <Button asChild variant="outline">
                <Link to="/orders">View All Orders</Link>
              </Button>
              <Button asChild>
                <Link to="/checkout">Try Payment Again</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link to="/orders">View All Orders</Link>
              </Button>
              <Button asChild>
                <Link to="/">Continue Shopping</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
