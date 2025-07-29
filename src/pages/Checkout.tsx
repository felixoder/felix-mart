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
      // Always use production mode since we're using production credentials
      // The backend function will handle sandbox vs production API endpoints
      const cashfreeMode = "production";
      
      console.log('🔧 Initializing Cashfree in mode:', cashfreeMode);
      console.log('🏠 Current hostname:', window.location.hostname);
      
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
      // ALWAYS use real Supabase functions - no local server, no mock
      const apiBaseUrl = "https://kwsqhrqhtcuacfvmxwji.supabase.co";
      const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3FocnFodGN1YWNmdm14d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDEyNTgsImV4cCI6MjA2OTExNzI1OH0.w677z2scEUSeLvsVqA3pPBUx0TihKB3LP1QuedLgqvQ";
      
      console.log('🌍 Using REAL Cashfree API via Supabase functions');
      console.log('🔗 API Base URL:', apiBaseUrl);
      console.log('🏠 Current hostname:', window.location.hostname);
      
      const response = await fetch(
        `${apiBaseUrl}/functions/v1/cashfree-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
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
      console.log('📊 Response status:', response.status);
      console.log('📋 Full response object:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
      }
      
      if (data.payment_session_id) {
        console.log('✅ Payment session ID found:', data.payment_session_id);
        
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
        
        console.log('🚀 Initiating Cashfree checkout with options:', checkoutOptions);
        cashfree.checkout(checkoutOptions);
      } else {
        console.error('❌ No payment_session_id in response:', data);
        throw new Error(`Failed to create payment session: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <Navbar user={user} cartItemsCount={cartItems.length} onCartClick={() => {}} />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl mb-4">
            🛒
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Almost There! 🎉
          </h1>
          <p className="text-gray-600 text-lg">
            Just a few more steps to get your amazing toys! 🧸✨
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Information - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50/30 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center text-xl">
                  <span className="mr-2">🚚</span>
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-purple-700 font-semibold">
                      📝 Full Name
                    </Label>
                    <Input 
                      id="name" 
                      placeholder="Enter your full name" 
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-purple-700 font-semibold">
                      🏠 Address
                    </Label>
                    <Input 
                      id="address" 
                      placeholder="Enter your complete address" 
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-purple-700 font-semibold">
                        🏙️ City
                      </Label>
                      <Input 
                        id="city" 
                        placeholder="Enter your city" 
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-purple-700 font-semibold">
                        📮 Postal Code
                      </Label>
                      <Input 
                        id="postalCode" 
                        placeholder="Enter postal code" 
                        className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-purple-700 font-semibold">
                      📱 Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter your phone number" 
                      className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 rounded-xl"
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary - Takes 1 column on large screens */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-yellow-50/30 overflow-hidden sticky top-8">
              <CardHeader className="bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800">
                <CardTitle className="flex items-center text-xl font-bold">
                  <span className="mr-2">📋</span>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-purple-600">Loading your cart... 🛍️</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                          <img
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-purple-800 text-sm">{item.name}</p>
                            <p className="text-xs text-purple-600">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-purple-700">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-purple-200 pt-4 space-y-3">
                      <div className="flex justify-between text-purple-700">
                        <p className="flex items-center">
                          <span className="mr-1">🛍️</span>
                          Subtotal
                        </p>
                        <p className="font-semibold">₹{subtotal.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between text-purple-700">
                        <p className="flex items-center">
                          <span className="mr-1">🚚</span>
                          Delivery Charge
                        </p>
                        <p className="font-semibold">₹{deliveryCharge.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between font-bold text-lg text-purple-800 border-t border-purple-200 pt-3 bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-xl">
                        <p className="flex items-center">
                          <span className="mr-1">💰</span>
                          Total
                        </p>
                        <p>₹{total.toFixed(2)}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Button 
              className="w-full mt-6 h-14 text-lg font-bold bg-gradient-to-r from-green-400 to-blue-400 hover:from-green-500 hover:to-blue-500 text-white shadow-xl rounded-xl transform hover:scale-105 transition-all duration-300 border-none"
              onClick={handlePayment}
              disabled={loading}
            >
              <span className="mr-2">💳</span>
              {loading ? "Processing..." : "Proceed to Payment 🚀"}
            </Button>
            
            {/* Trust Indicators */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-center space-x-4 text-sm text-green-700">
                <div className="flex items-center">
                  <span className="mr-1">🔒</span>
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <span className="mr-1">🛡️</span>
                  Safe & Protected
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
