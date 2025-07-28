import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, AlertTriangle, Package2, Clock, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const RefundPolicy = () => {
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
            <RotateCcw className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-lg text-muted-foreground">
            Important information about our refund and return policy.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 27, 2025
          </p>
        </div>

        <div className="space-y-8">
          {/* No Refund Policy Alert */}
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong className="font-semibold">Important Notice:</strong> felixmart maintains a strict no-refund policy. All sales are final once payment is confirmed. Please read this policy carefully before making a purchase.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                No Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h3 className="font-bold text-red-800 mb-4 text-lg">ALL SALES ARE FINAL</h3>
                <div className="space-y-3 text-red-700">
                  <p><strong>• No Cash Refunds:</strong> We do not offer cash refunds under any circumstances.</p>
                  <p><strong>• No Store Credit:</strong> Store credit or vouchers are not provided for returned items.</p>
                  <p><strong>• No Exchanges:</strong> Product exchanges are not permitted unless the item is damaged or defective.</p>
                  <p><strong>• Final Decision:</strong> Once your order is confirmed and payment is processed, the sale is considered final.</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                By placing an order with felixmart, you acknowledge and agree to this no-refund policy. Please ensure you are satisfied with your purchase decision before completing your order.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package2 className="h-6 w-6 text-primary" />
                Damaged or Defective Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                While we maintain a no-refund policy, we stand behind the quality of our products. If you receive a damaged or defective item, we will provide a replacement under the following conditions:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Eligible for Replacement:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Products damaged during shipping</li>
                    <li>Manufacturing defects or quality issues</li>
                    <li>Items significantly different from description</li>
                    <li>Missing parts or accessories</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">NOT Eligible for Replacement:</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Change of mind or buyer's remorse</li>
                    <li>Damage caused by misuse or negligence</li>
                    <li>Normal wear and tear</li>
                    <li>Products used or altered by the customer</li>
                    <li>Slight color variations due to screen display differences</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-primary" />
                Replacement Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="font-semibold text-blue-800 mb-2">Time Limit: 24 Hours</p>
                <p className="text-blue-700">
                  You must contact us within 24 hours of delivery to report any damage or defects. Claims reported after this period will not be considered.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Steps to Request a Replacement:</h4>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Contact our customer support immediately upon discovering the issue</li>
                  <li>Provide your order number and detailed description of the problem</li>
                  <li>Send clear photos of the damaged or defective product</li>
                  <li>Keep the original packaging and all accessories</li>
                  <li>Wait for our team to review and approve the replacement request</li>
                  <li>Follow the return shipping instructions (if required)</li>
                  <li>Receive your replacement product (subject to availability)</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-2">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Replacements are subject to product availability</li>
                  <li>If the exact product is unavailable, we may offer a similar alternative</li>
                  <li>All replacement requests are reviewed on a case-by-case basis</li>
                  <li>Our decision on replacement eligibility is final</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pre-Purchase Considerations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To ensure your satisfaction and avoid any issues, please consider the following before making a purchase:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Carefully review product descriptions, specifications, and images</li>
                <li>Check size charts and measurements if applicable</li>
                <li>Read customer reviews and ratings</li>
                <li>Contact our support team if you have any questions</li>
                <li>Ensure your delivery address is correct and accessible</li>
                <li>Be available to receive your order to prevent damage</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Why This Policy?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our no-refund policy allows us to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Maintain competitive pricing for our customers</li>
                <li>Ensure product authenticity and quality control</li>
                <li>Reduce operational costs and pass savings to customers</li>
                <li>Focus resources on product quality and customer service</li>
                <li>Maintain fair business practices for all customers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Phone className="h-6 w-6 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you have received a damaged or defective product, or if you have any questions about this policy, please contact us immediately:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>felixmart Customer Support</strong></p>
                <p>Debayan Ghosh</p>
                <p>Sutragarh, Lankapara</p>
                <p>Santipur, Nadia, West Bengal - 741404</p>
                <p>Email: support@felixmart.com</p>
                <p>Phone: +91 98765 43210</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Available: Monday to Saturday, 9:00 AM to 6:00 PM IST
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This refund policy is part of our Terms of Service and is governed by the laws of India. 
                By making a purchase, you agree to these terms and acknowledge that you understand our no-refund policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
