import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Phone } from "lucide-react";

const PrivacyPolicy = () => {
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
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-muted-foreground">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 27, 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Name, email address, and phone number</li>
                  <li>Shipping and billing addresses</li>
                  <li>Payment information (processed securely through our payment partners)</li>
                  <li>Order history and preferences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Information</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Website usage patterns and preferences</li>
                  <li>Cookie and session data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="h-6 w-6 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Process and fulfill your orders</li>
                <li>Communicate about your orders and account</li>
                <li>Provide customer support and assistance</li>
                <li>Improve our products and services</li>
                <li>Send promotional offers (with your consent)</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-primary" />
                Information Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>With service providers who help us operate our business (shipping, payment processing)</li>
                <li>To comply with legal requirements or protect our rights</li>
                <li>In connection with a business transfer or merger</li>
                <li>With your explicit consent</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>SSL encryption for all data transmission</li>
                <li>Secure payment processing through certified partners</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Access and review your personal information</li>
                <li>Correct or update your information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Lodge a complaint with relevant authorities</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We use cookies and similar technologies to enhance your browsing experience, analyze website traffic, and personalize content.
              </p>
              <p className="text-muted-foreground">
                You can control cookie settings through your browser preferences. However, disabling cookies may affect website functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
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
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p><strong>felixmart</strong></p>
                <p>Debayan Ghosh</p>
                <p>Sutragarh, Lankapara</p>
                <p>Santipur, Nadia, West Bengal - 741404</p>
                <p>Email: support@felixmart.com</p>
                <p>Phone: +91 98765 43210</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
