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
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const { toast } = useToast();

  const orderId = searchParams.get('order_id');
  const paymentSessionId = searchParams.get('payment_session_id');

  useEffect(() => {
    if (orderId) {
      verifyPaymentAndFetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const verifyPaymentAndFetchOrder = async () => {
    try {
      // First, verify payment status with Cashfree
      if (paymentSessionId) {
        // Use local server for development, Supabase functions for production
        const isLocalDev = window.location.hostname === 'localhost';
        const apiBaseUrl = isLocalDev 
          ? "http://localhost:3001" 
          : "https://kwsqhrqhtcuacfvmxwji.supabase.co";
          
        const response = await fetch(
          `${apiBaseUrl}/functions/v1/verify-payment`,
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
          setPaymentStatus(paymentData.payment_status === 'SUCCESS' ? 'success' : 'failed');
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
              <span className="font-medium">Payment Status:</span>
              <span className={`capitalize ${
                paymentStatus === 'success' ? 'text-green-600' : 
                paymentStatus === 'failed' ? 'text-destructive' : 'text-yellow-600'
              }`}>
                {paymentStatus}
              </span>
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
          <Button asChild variant="outline">
            <Link to="/orders">View All Orders</Link>
          </Button>
          <Button asChild>
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
