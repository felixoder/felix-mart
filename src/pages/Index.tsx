import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { 
  Store, 
  Search, 
  Star, 
  Truck, 
  Shield, 
  Clock, 
  ShoppingBag,
  Award,
  Users,
  Heart,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  MapPin,
  ChevronDown
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
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

    fetchProducts();

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProducts(data || []);
      
      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .single();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity: 1,
          });

        if (error) throw error;
      }

      getCartItemsCount(user.id);
      toast({
        title: "Success",
        description: "Product added to cart",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        cartItemsCount={cartItemsCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    felixmart Premium Store
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-lg">
                  Discover premium handcrafted products, carefully curated for the modern lifestyle. 
                  Quality meets elegance in every piece.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Shop Now
                </Button>
                <Button size="lg" variant="outline" className="border-white text-black bg-white hover:bg-white/90 hover:text-black font-semibold">
                  Learn More
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="font-medium">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">10K+ Happy Customers</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Award className="h-12 w-12 text-yellow-300" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Shield className="h-12 w-12 text-green-300" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Truck className="h-12 w-12 text-blue-300" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Heart className="h-12 w-12 text-red-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose felixmart?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're committed to providing exceptional quality and service that exceeds expectations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                <p className="text-muted-foreground">Handpicked products with superior craftsmanship and attention to detail</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground">Quick and secure shipping with tracking across India</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Secure Payment</h3>
                <p className="text-muted-foreground">Safe and encrypted transactions with multiple payment options</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">24/7 Support</h3>
                <p className="text-muted-foreground">Round-the-clock customer service for all your needs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-lg text-muted-foreground">Discover our most popular items</p>
            </div>
            <Button variant="outline" className="hidden md:flex">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                size="sm"
              >
                All Products
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-premium h-96 animate-pulse bg-muted"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Products will appear here once added by admin"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about shopping with us</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">How long does shipping take?</AccordionTrigger>
              <AccordionContent>
                We offer fast delivery across India. Standard shipping takes 3-5 business days, while express delivery 
                takes 1-2 business days. Delivery charges are ₹70 for all orders.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">What payment methods do you accept?</AccordionTrigger>
              <AccordionContent>
                We accept all major payment methods including UPI, Net Banking, Credit/Debit Cards, and Digital Wallets. 
                All transactions are secured with 256-bit SSL encryption.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">Do you have a return policy?</AccordionTrigger>
              <AccordionContent>
                We maintain a strict no-refund policy. However, if you receive a damaged or defective product, 
                please contact us within 24 hours of delivery for a replacement.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">How can I track my order?</AccordionTrigger>
              <AccordionContent>
                Once your order is shipped, you'll receive a tracking number via email. You can also check your 
                order status by visiting the "My Orders" section in your account.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg px-6">
              <AccordionTrigger className="text-left">Are your products authentic?</AccordionTrigger>
              <AccordionContent>
                Yes, all our products are 100% authentic and handpicked for quality. We work directly with 
                artisans and trusted suppliers to ensure authenticity and superior craftsmanship.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">felixmart</h3>
              <p className="text-gray-300">
                Premium handcrafted products for the modern lifestyle. Quality meets elegance in every piece.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-300 hover:text-white transition-colors">Home</a></li>
                <li><a href="/orders" className="text-gray-300 hover:text-white transition-colors">My Orders</a></li>
                <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Legal</h4>
              <ul className="space-y-2">
                <li><a href="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/refund-policy" className="text-gray-300 hover:text-white transition-colors">Refund Policy</a></li>
                <li><a href="/shipping-policy" className="text-gray-300 hover:text-white transition-colors">Shipping Policy</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="text-gray-300">
                    <p>Debayan Ghosh</p>
                    <p>Sutragarh, Lankapara</p>
                    <p>Santipur, Nadia</p>
                    <p>West Bengal - 741404</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href="mailto:support@felixmart.com" className="text-gray-300 hover:text-white transition-colors">
                    support@felixmart.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href="tel:+919876543210" className="text-gray-300 hover:text-white transition-colors">
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400">
                © 2025 felixmart. All rights reserved.
              </p>
              <p className="text-gray-400 mt-2 md:mt-0">
                Designed & Developed by Debayan Ghosh
              </p>
            </div>
          </div>
        </div>
      </footer>

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        userId={user?.id || null}
        onCartUpdate={() => {
          if (user) {
            getCartItemsCount(user.id);
          } else {
            const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
            const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
            setCartItemsCount(totalCount);
          }
        }}
      />
    </div>
  );
};

export default Index;
