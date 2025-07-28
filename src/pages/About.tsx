import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Users, 
  Award, 
  Truck, 
  Shield, 
  Star,
  Target,
  Eye,
  Handshake,
  Sparkles,
  Building,
  Calendar
} from "lucide-react";

const About = () => {
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About felixmart</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Where premium craftsmanship meets modern elegance. We're passionate about bringing you handpicked, 
            high-quality products that enhance your lifestyle and express your unique taste.
          </p>
        </div>

        {/* Our Story */}
        <section className="mb-16">
          <Card className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    felixmart was born from a simple belief: everyone deserves access to beautifully crafted, 
                    premium quality products that reflect their personal style and values.
                  </p>
                  <p>
                    Founded by Debayan Ghosh in Santipur, West Bengal, our journey began with a passion for 
                    discovering unique, handcrafted items that tell a story. We work directly with skilled artisans 
                    and trusted suppliers to bring you products that combine traditional craftsmanship with contemporary design.
                  </p>
                  <p>
                    What started as a small venture has grown into a trusted destination for customers across India 
                    who appreciate quality, authenticity, and exceptional service.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">2025</p>
                    <p className="text-sm text-muted-foreground">Founded</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">10K+</p>
                    <p className="text-sm text-muted-foreground">Happy Customers</p>
                  </div>
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">4.9/5</p>
                    <p className="text-sm text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center">
                    <Building className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">Pan-India</p>
                    <p className="text-sm text-muted-foreground">Delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Mission & Vision */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Target className="h-6 w-6 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To democratize access to premium handcrafted products by connecting discerning customers 
                  with skilled artisans and quality manufacturers. We strive to make luxury accessible while 
                  maintaining the highest standards of craftsmanship and customer service.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Eye className="h-6 w-6 text-primary" />
                  Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To become India's most trusted destination for premium lifestyle products, known for our 
                  commitment to quality, authenticity, and exceptional customer experience. We envision a future 
                  where everyone can surround themselves with beautiful, meaningful products.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do and shape our relationship with customers, partners, and community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Quality First</h3>
                <p className="text-muted-foreground">
                  We never compromise on quality. Every product is carefully selected and inspected to meet our high standards.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Handshake className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Trust & Transparency</h3>
                <p className="text-muted-foreground">
                  We build lasting relationships through honest communication, transparent practices, and reliable service.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Customer Delight</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. We go above and beyond to ensure every interaction exceeds expectations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Innovation</h3>
                <p className="text-muted-foreground">
                  We continuously evolve our product offerings and shopping experience to meet changing customer needs.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Security</h3>
                <p className="text-muted-foreground">
                  Your personal information and transactions are protected with industry-leading security measures.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg mb-3">Community</h3>
                <p className="text-muted-foreground">
                  We support local artisans and contribute to sustainable practices that benefit our community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Makes Us Different</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the unique advantages that set felixmart apart from other online retailers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Curated Selection</h3>
                  <p className="text-muted-foreground">
                    Every product is handpicked by our team for quality, design, and value. We don't just sell products; 
                    we curate experiences.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Fast & Reliable Delivery</h3>
                  <p className="text-muted-foreground">
                    With our pan-India delivery network, we ensure your orders reach you quickly and safely, 
                    no matter where you are.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Secure Shopping</h3>
                  <p className="text-muted-foreground">
                    Your privacy and security are paramount. We use advanced encryption and secure payment 
                    gateways to protect your information.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Personal Touch</h3>
                  <p className="text-muted-foreground">
                    We treat every customer like family. Our dedicated support team is always ready to help 
                    with personalized assistance.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Founder's Note */}
        <section className="mb-16">
          <Card className="p-8 bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-6">A Note from Our Founder</h2>
              <div className="max-w-3xl mx-auto">
                <blockquote className="text-lg text-muted-foreground italic mb-6">
                  "When I started felixmart, my vision was simple: to create a place where quality meets 
                  affordability, where every customer feels valued, and where beautiful products can be discovered 
                  by everyone. Today, I'm proud to see that vision come to life through our growing community of 
                  satisfied customers across India."
                </blockquote>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-semibold text-lg">Debayan Ghosh</p>
                    <p className="text-muted-foreground">Founder & CEO, felixmart</p>
                    <p className="text-sm text-muted-foreground mt-1">Santipur, Nadia, West Bengal</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Customer Promise */}
        <section className="mb-16">
          <Card className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Our Promise to You</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <Star className="h-12 w-12 text-yellow-500 mb-3" />
                <h3 className="font-semibold mb-2">Quality Guaranteed</h3>
                <p className="text-muted-foreground text-sm">
                  Every product meets our strict quality standards
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="font-semibold mb-2">Secure Shopping</h3>
                <p className="text-muted-foreground text-sm">
                  Your data and payments are always protected
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Heart className="h-12 w-12 text-red-500 mb-3" />
                <h3 className="font-semibold mb-2">Customer First</h3>
                <p className="text-muted-foreground text-sm">
                  Your satisfaction is our top priority
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Awards and Recognition */}
        <section>
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Recognition & Achievements</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Star className="h-4 w-4 mr-2" />
                4.9/5 Customer Rating
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Users className="h-4 w-4 mr-2" />
                10K+ Happy Customers
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Award className="h-4 w-4 mr-2" />
                Quality Assured Products
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Truck className="h-4 w-4 mr-2" />
                Pan-India Delivery
              </Badge>
            </div>
            <p className="text-muted-foreground mt-6 max-w-2xl mx-auto">
              These achievements reflect our unwavering commitment to excellence and our customers' trust in our brand.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
