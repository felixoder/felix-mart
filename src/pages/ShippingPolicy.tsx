import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin, Clock, Package, CreditCard, Phone, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ShippingPolicy = () => {
  const [user, setUser] = useState<User | null>(null);
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          getCartItemsCount(session.user.id);
        } else {
          const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
          const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemsCount(totalCount);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const getCartItemsCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select("quantity")
        .eq("user_id", userId);

      if (error) throw error;

      const totalCount = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartItemsCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart count:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        cartItemsCount={cartItemsCount}
        onCartClick={() => {}}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our shipping and delivery process.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 27, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                Shipping Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Pan-India Delivery
                </Badge>
              </div>
              <p className="text-muted-foreground">
                We proudly ship to all states and union territories across India. Whether you're in a metro city or a remote location, we'll deliver your order to your doorstep.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Major Cities</h4>
                  <p className="text-sm text-muted-foreground">Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad, and all metro cities</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Tier 2 & 3 Cities</h4>
                  <p className="text-sm text-muted-foreground">All district headquarters, smaller cities, and towns across India</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                Delivery Times
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Standard Delivery</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-blue-600">3-5 Days</p>
                    <p className="text-sm text-muted-foreground">Business days from order confirmation</p>
                    <Badge variant="secondary">Default Option</Badge>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Express Delivery</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-bold text-green-600">1-2 Days</p>
                    <p className="text-sm text-muted-foreground">Available in select cities</p>
                    <Badge variant="secondary">Limited Areas</Badge>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800">Delivery Time Note</p>
                    <p className="text-yellow-700 text-sm">
                      Delivery times are estimates based on business days and may vary due to location, weather conditions, local holidays, or carrier delays. Remote areas may require additional 1-2 days.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                Shipping Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-6 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary mb-2">₹70</p>
                <p className="text-lg font-semibold mb-1">Flat Shipping Rate</p>
                <p className="text-muted-foreground">Same rate across all of India</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">All States & UTs</span>
                  <span className="font-semibold">₹70</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Remote Areas</span>
                  <span className="font-semibold">₹70</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">Express Delivery</span>
                  <span className="font-semibold">₹70</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="font-semibold text-green-800 mb-1">Simple & Transparent</p>
                <p className="text-green-700 text-sm">
                  No hidden charges, no weight-based pricing, no location surcharges. One flat rate for everyone.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Processing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-semibold">Processing Timeline:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">1</div>
                    <div>
                      <p className="font-medium">Order Confirmation</p>
                      <p className="text-sm text-muted-foreground">Immediate after payment verification</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">2</div>
                    <div>
                      <p className="font-medium">Order Processing</p>
                      <p className="text-sm text-muted-foreground">1-2 business days for packaging and quality check</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">3</div>
                    <div>
                      <p className="font-medium">Shipping</p>
                      <p className="text-sm text-muted-foreground">Handover to courier partner with tracking details</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">4</div>
                    <div>
                      <p className="font-medium">Delivery</p>
                      <p className="text-sm text-muted-foreground">At your doorstep within estimated time</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Stay updated on your order status with our comprehensive tracking system:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Email confirmation with order details immediately after purchase</li>
                <li>SMS notification when your order is shipped with tracking number</li>
                <li>Real-time tracking through our website's "My Orders" section</li>
                <li>Delivery notifications via SMS and email</li>
                <li>24/7 order status updates through our customer support</li>
              </ul>
              
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">Track Your Order</p>
                <p className="text-blue-700 text-sm">
                  Log in to your account and visit the "My Orders" section to track your shipment in real-time. You can also use the tracking number provided in the shipping confirmation email.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Partners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We work with trusted and reliable shipping partners to ensure safe and timely delivery:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">BlueDart</p>
                  <p className="text-sm text-muted-foreground">Express & Standard</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Delhivery</p>
                  <p className="text-sm text-muted-foreground">Pan-India Coverage</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Ecom Express</p>
                  <p className="text-sm text-muted-foreground">Reliable Delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To ensure smooth delivery, please note the following:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Provide complete and accurate delivery address with landmarks</li>
                <li>Include a valid phone number for delivery coordination</li>
                <li>Be available at the delivery address during business hours</li>
                <li>Provide alternative contact person if you won't be available</li>
                <li>Verify your order upon delivery before signing</li>
                <li>Report any damage or missing items immediately</li>
              </ul>

              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Important</p>
                    <p className="text-red-700 text-sm">
                      Ensure someone is available to receive the package. If multiple delivery attempts fail, the package may be returned to us, and additional shipping charges may apply for re-delivery.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Special Circumstances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Delays Beyond Our Control</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Natural disasters or extreme weather conditions</li>
                    <li>National holidays or local festivals</li>
                    <li>Strikes or transportation disruptions</li>
                    <li>Government restrictions or lockdowns</li>
                    <li>Incorrect or incomplete delivery address</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Failed Deliveries</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Customer not available after multiple attempts</li>
                    <li>Incorrect address or contact information</li>
                    <li>Customer refuses to accept the package</li>
                    <li>Delivery location inaccessible to courier</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                Shipping Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For any shipping-related queries, tracking issues, or delivery concerns, please contact our customer support:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>Luxe Craft Shop Shipping Support</strong></p>
                <p>Debayan Ghosh</p>
                <p>Sutragarh, Lankapara</p>
                <p>Santipur, Nadia, West Bengal - 741404</p>
                <p>Email: support@luxecraftshop.com</p>
                <p>Phone: +91 98765 43210</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Available: Monday to Saturday, 9:00 AM to 6:00 PM IST
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
