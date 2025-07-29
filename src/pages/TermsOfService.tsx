import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CreditCard, Package, Users } from "lucide-react";

const TermsOfService = () => {
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
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-muted-foreground">
            Please read these terms carefully before using our services.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 27, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using felixmart website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You must provide accurate and complete information when creating an account</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You must be at least 18 years old to create an account and make purchases</li>
                <li>We reserve the right to terminate accounts that violate these terms</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                Product Information and Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Product Descriptions</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>We strive to provide accurate product descriptions and images</li>
                  <li>Colors and dimensions may vary slightly from what appears on your screen</li>
                  <li>Product availability is subject to change without notice</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Order Processing</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>All orders are subject to acceptance and availability</li>
                  <li>We reserve the right to limit quantities or refuse orders</li>
                  <li>Order confirmation does not guarantee product availability</li>
                  <li>Prices are subject to change without notice</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-primary" />
                Pricing and Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All prices are displayed in Indian Rupees (₹) and include applicable taxes</li>
                <li>Payment must be made in full before order processing</li>
                <li>We accept various payment methods as displayed during checkout</li>
                <li>Delivery charges of ₹70 apply to all orders</li>
                <li>We reserve the right to change prices at any time</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping and Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Standard shipping takes 3-5 business days across India</li>
                <li>Express delivery takes 1-2 business days (where available)</li>
                <li>Delivery times are estimates and not guaranteed</li>
                <li>Risk of loss passes to you upon delivery to the carrier</li>
                <li>We are not responsible for delays caused by shipping carriers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                Returns and Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="font-semibold text-yellow-800 mb-2">Important: No Refund Policy</p>
                <p className="text-yellow-700">
                  We maintain a strict no-refund policy. All sales are final once the order is confirmed and payment is processed.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Damaged or Defective Products</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Contact us within 24 hours of delivery if you receive a damaged or defective product</li>
                  <li>Provide photos and order details for verification</li>
                  <li>We will provide a replacement for verified damaged or defective items</li>
                  <li>Replacement is subject to product availability</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>All content on this website is owned by felixmart or its licensors</li>
                <li>You may not copy, reproduce, or distribute any content without permission</li>
                <li>Product images and descriptions are for personal use only</li>
                <li>Trademarks and logos are protected intellectual property</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You may not use our service:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                felixmart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
              <p className="text-muted-foreground">
                Our total liability shall not exceed the amount paid by you for the specific product or service giving rise to the claim.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                These Terms shall be interpreted and governed by the laws of India. Any disputes arising from these terms shall be subject to the jurisdiction of courts in Nadia, West Bengal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We reserve the right to update these Terms of Service at any time. We will notify users of any material changes by posting the updated terms on this page. Your continued use of the service after any changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>felixmart</strong></p>
                <p>Debayan Ghosh</p>
                <p>Sutragarh, Lankapara</p>
                <p>Santipur, Nadia, West Bengal - 741404</p>
                <p>Email: debayanghosh408@gmail.com</p>
                <p>Phone: +91 9609384607</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
