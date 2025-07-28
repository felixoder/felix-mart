import { useState, useEffect } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";

const Checkout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryCharge] = useState(70); // Fixed delivery charge of ₹70
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [cashfree, setCashfree] = useState<any>(null);

  useEffect(() => {
    const initializeCashfree = async () => {
      // Use production mode for deployed environments
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      const cashfreeMode = isProduction ? "production" : "sandbox";
      
      console.log('🔧 Initializing Cashfree in mode:', cashfreeMode);
      
      const cashfreeInstance = await load({
        mode: cashfreeMode,
      });
      setCashfree(cashfreeInstance);
    };
    initializeCashfree();
  }, []);

  useEffect(() => {
    const checkUserAndFetchItems = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.setItem('redirectUrl', '/checkout');
        window.location.href = '/auth';
      } else {
        setSession(session);
        setUser(session.user);
        fetchCartItems(session.user.id);
      }
    };

    checkUserAndFetchItems();
  }, []);

  const fetchCartItems = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products (*)
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const items = data.map(item => ({ ...item.products, quantity: item.quantity }));
      setCartItems(items);
      const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setSubtotal(cartSubtotal);
      setTotal(cartSubtotal + deliveryCharge);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to proceed to payment",
        variant: "destructive",
      });
      return;
    }

    // Validate form fields
    const name = (document.getElementById("name") as HTMLInputElement).value;
    const address = (document.getElementById("address") as HTMLInputElement).value;
    const city = (document.getElementById("city") as HTMLInputElement).value;
    const postalCode = (document.getElementById("postalCode") as HTMLInputElement).value;
    const phone = (document.getElementById("phone") as HTMLInputElement).value;

    if (!name || !address || !city || !postalCode || !phone) {
      toast({
        title: "Error",
        description: "Please fill in all shipping information",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate stock availability before placing order
      for (const item of cartItems) {
        const { data: currentProduct, error: stockError } = await supabase
          .from("products")
          .select("stock_quantity, name")
          .eq("id", item.id)
          .single();

        if (stockError) {
          throw new Error(`Failed to check stock for ${item.name}`);
        }

        if (currentProduct.stock_quantity < item.quantity) {
          toast({
            title: "Insufficient Stock",
            description: `Sorry, only ${currentProduct.stock_quantity} units of ${currentProduct.name} are available. Please update your cart.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Create order in database first
      const shippingAddress = {
        name,
        address,
        city,
        postalCode,
        phone,
      };

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          status: "pending",
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update stock quantities for each product
      for (const item of cartItems) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.id)
          .single();

        if (fetchError) {
          console.error("Error fetching product stock:", fetchError);
          continue;
        }

        const newStockQuantity = Math.max(0, currentProduct.stock_quantity - item.quantity);
        
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newStockQuantity })
          .eq("id", item.id);

        if (updateError) {
          console.error("Error updating product stock:", updateError);
          toast({
            title: "Warning",
            description: `Failed to update stock for ${item.name}`,
            variant: "destructive",
          });
        } else {
          console.log(`Stock updated for ${item.name}: ${currentProduct.stock_quantity} -> ${newStockQuantity}`);
        }
      }

      // Create payment session with Cashfree
      // Always use Supabase functions in production
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const apiBaseUrl = isLocalDev 
        ? "http://localhost:3001" 
        : "https://kwsqhrqhtcuacfvmxwji.supabase.co";
      
      console.log('🌍 Environment:', isLocalDev ? 'Development (Local)' : 'Production (Supabase)');
      console.log('🔗 API Base URL:', apiBaseUrl);
      
      const response = await fetch(
        `${apiBaseUrl}/functions/v1/cashfree-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isLocalDev ? {} : { Authorization: `Bearer ${session?.access_token}` }),
          },
          body: JSON.stringify({
            amount: total,
            customer_id: user.id,
            customer_email: user.email,
            customer_phone: phone,
            order_id: order.id,
          }),
        }
      );

      const data = await response.json();
      console.log('💳 Cashfree response:', data);
      
      if (data.payment_session_id) {
        // Clear cart after successful order creation
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        // Production Cashfree payment flow (no demo/mock in production)
        const checkoutOptions = {
          paymentSessionId: data.payment_session_id,
          returnUrl: `${window.location.origin}/order-success?order_id=${order.id}&payment_session_id=${data.payment_session_id}`,
          onCancel: () => {
            // Handle cancellation
            window.location.href = `/order-success?order_id=${order.id}&payment_session_id=${data.payment_session_id}&status=CANCELLED`;
          },
          onError: (error: any) => {
            console.error('Payment error:', error);
            window.location.href = `/order-success?order_id=${order.id}&payment_session_id=${data.payment_session_id}&status=FAILED`;
          }
        };
        
        cashfree.checkout(checkoutOptions);
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: "Failed to create payment session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} cartItemsCount={cartItems.length} onCartClick={() => {}} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="Enter your address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Enter your city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" placeholder="Enter your postal code" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter your phone number" />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center mb-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p>₹{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4 space-y-2">
                      <div className="flex justify-between">
                        <p>Subtotal</p>
                        <p>₹{subtotal.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between">
                        <p>Delivery Charge</p>
                        <p>₹{deliveryCharge.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <p>Total</p>
                        <p>₹{total.toFixed(2)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <Button className="w-full mt-4 btn-premium" onClick={handlePayment}>
              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
