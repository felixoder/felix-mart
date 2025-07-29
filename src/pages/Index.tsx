import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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

  const animateToCart = (productImage: string, sourceElement: HTMLElement) => {
    // Only animate if cart is not open
    if (isCartOpen) return;
    
    const cartButton = document.getElementById('cart-button');
    if (!cartButton) return;

    // Get source and target positions
    const sourceRect = sourceElement.getBoundingClientRect();
    const targetRect = cartButton.getBoundingClientRect();

    // Create clone element
    const clone = document.createElement('img');
    clone.src = productImage;
    clone.className = 'cart-animation-clone';
    clone.style.width = '60px';
    clone.style.height = '60px';
    clone.style.left = `${sourceRect.left + sourceRect.width / 2 - 30}px`;
    clone.style.top = `${sourceRect.top + sourceRect.height / 2 - 30}px`;

    document.body.appendChild(clone);

    // Trigger cart button pulse
    cartButton.classList.add('cart-pulse');
    setTimeout(() => cartButton.classList.remove('cart-pulse'), 600);

    // Animate to cart
    requestAnimationFrame(() => {
      clone.style.left = `${targetRect.left + targetRect.width / 2 - 15}px`;
      clone.style.top = `${targetRect.top + targetRect.height / 2 - 15}px`;
      clone.classList.add('animate');
    });

    // Remove clone after animation
    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        cartItemsCount={cartItemsCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 text-white overflow-hidden">
        {/* Floating toy decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-300 rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-20 w-6 h-6 bg-red-400 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-20 w-10 h-10 bg-green-400 rounded-full animate-bounce delay-500"></div>
          <div className="absolute bottom-10 right-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce delay-700"></div>
          <div className="absolute top-1/2 left-5 w-5 h-5 bg-cyan-300 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/3 right-5 w-7 h-7 bg-pink-300 rounded-full animate-bounce delay-200"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight font-rounded">
                  🎈 Welcome to{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent drop-shadow-lg">
                    felixmart Premium Store
                  </span>
                  {" "}🧸
                </h1>
                <p className="text-lg md:text-xl text-white/95 max-w-lg leading-relaxed">
                  🌟 Discover magical baby toys that spark joy, creativity, and endless fun! 
                  Safe, colorful, and designed to make every little one smile! 🎨✨
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/products')}
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800 hover:from-yellow-500 hover:to-orange-500 font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full border-2 border-white/20"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  🎁 Shop Toys Now
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate('/privacy-policy')}
                  className="border-2 border-white text-white bg-white/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white hover:border-transparent font-bold text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                >
                  🤔 Learn More
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-300 fill-current animate-pulse" />
                  <span className="font-bold">4.9/5 ⭐ Happy Parents!</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 animate-pulse" />
                  <span className="font-bold">10K+ 👶 Happy Babies</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-white/20 backdrop-blur-sm rounded-3xl p-8 border-4 border-white/30 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="bg-gradient-to-br from-red-300 to-red-400 backdrop-blur-sm rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="text-4xl animate-bounce">🚗</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-300 to-green-400 backdrop-blur-sm rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="text-4xl animate-bounce delay-200">🧸</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-300 to-blue-400 backdrop-blur-sm rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="text-4xl animate-bounce delay-300">🎲</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 backdrop-blur-sm rounded-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300 shadow-lg">
                    <div className="text-4xl animate-bounce delay-500">🎨</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Moved before Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-purple-600">
                🎁 Our Most Loved Baby Toys! 
              </h2>
              <p className="text-lg text-gray-600">Discover the toys that make babies giggle with joy! 😄✨</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/products')}
              className="hidden lg:flex border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full"
            >
              🔍 View All Toys <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Search and Filters - Aligned with product grid */}
          <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search bar aligned with grid */}
            <div className="relative w-full max-w-md lg:max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
              <Input
                placeholder="🔍 Search for amazing toys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-200"
              />
            </div>
            
            {/* View All button for mobile - aligned with search */}
            <div className="lg:hidden">
              <Button 
                variant="outline" 
                onClick={() => navigate('/products')}
                className="w-full border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white font-bold shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full"
              >
                🔍 View All Toys <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Category filters - full width aligned with grid */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                size="sm"
                className={selectedCategory === "all" 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full" 
                  : "border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 rounded-full shadow-md transform hover:scale-105 transition-all duration-300"
                }
              >
                🎈 All Toys
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className={selectedCategory === category 
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none shadow-lg transform hover:scale-105 transition-all duration-300 rounded-full" 
                    : "border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 rounded-full shadow-md transform hover:scale-105 transition-all duration-300"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="product-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card-premium h-96 animate-pulse bg-muted"></div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧸</div>
              <h3 className="text-lg font-semibold mb-2 text-purple-600">Oops! No toys found 🤔</h3>
              <p className="text-gray-600">
                {searchQuery || selectedCategory !== "all"
                  ? "Try searching for different toys or check other categories! 🎈"
                  : "New amazing toys will appear here soon! Stay tuned! ✨"}
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {filteredProducts.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAnimateToCart={animateToCart}
                  loading={loading}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Now after Products */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-purple-600">
              🌈 Why Choose felixmart for Your Little One? 👶
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're committed to providing safe, fun, and educational toys that help your baby grow and smile! 🎈
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-2xl animate-bounce">🏆</div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-purple-600">🌟 Premium Baby-Safe Quality</h3>
                <p className="text-gray-600">All toys are tested for safety, made with non-toxic materials, and designed for tiny hands! 👶✋</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-green-100 bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-2xl animate-bounce delay-200">🚚</div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-green-600">🚀 Super Fast Delivery</h3>
                <p className="text-gray-600">Lightning-fast shipping so your little one doesn't have to wait long for their new favorite toy! ⚡</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-2xl animate-bounce delay-300">🔒</div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-purple-600">🛡️ 100% Secure Shopping</h3>
                <p className="text-gray-600">Safe and encrypted payments with multiple options - shop with complete peace of mind! 💳✨</p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardContent className="pt-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <div className="text-2xl animate-bounce delay-500">💬</div>
                </div>
                <h3 className="font-bold text-lg mb-2 text-orange-600">🤗 Parent Support 24/7</h3>
                <p className="text-gray-600">Round-the-clock support for all your questions - because parenting never sleeps! 🌙👨‍👩‍👧‍👦</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-purple-600">
              🤔 Questions About Our Baby Toys?
            </h2>
            <p className="text-lg text-gray-600">Everything parent need to know about shopping for their little ones! 👶💕</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-white rounded-lg px-6 shadow-md border border-purple-100">
              <AccordionTrigger className="text-left font-semibold text-purple-700">
                🚚 How fast can my baby get their new toy?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Super fast delivery across India! 🇮🇳 Standard shipping takes 3-5 business days, while express delivery 
                takes just 1-2 business days. Delivery charges are only ₹70 for all orders - because we know babies can't wait! 😄
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-white rounded-lg px-6 shadow-md border border-purple-100">
              <AccordionTrigger className="text-left font-semibold text-purple-700">
                💳 What payment methods are safe for parents?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We accept all major payment methods including UPI, Net Banking, Credit/Debit Cards, and Digital Wallets! 
                All transactions are 100% secure with 256-bit SSL encryption - shop with complete peace of mind! 🔒✨
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-white rounded-lg px-6 shadow-md border border-purple-100">
              <AccordionTrigger className="text-left font-semibold text-purple-700">
                🔄 What if my baby doesn't like their toy?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                We maintain a strict no-refund policy. However, if you receive a damaged or defective toy, 
                please contact us within 24 hours of delivery for a replacement - your baby's happiness is our priority! 🧸💝
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-white rounded-lg px-6 shadow-md border border-purple-100">
              <AccordionTrigger className="text-left font-semibold text-purple-700">
                📦 Can I track my baby's new toy delivery?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Absolutely! 📱 Once your order is shipped, you'll receive a tracking number via email. You can also check your 
                order status anytime by visiting the "My Orders" section in your account - stay updated every step of the way!
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-white rounded-lg px-6 shadow-md border border-purple-100">
              <AccordionTrigger className="text-left font-semibold text-purple-700">
                🛡️ Are all toys safe for my baby?
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                Yes! 🌟 All our toys are 100% baby-safe, made with non-toxic materials, and rigorously tested for safety. 
                We work only with trusted suppliers who understand that baby safety comes first - every toy is parent-approved! 👶✅
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">🎈 felixmart</h3>
              <p className="text-purple-100">
                Making babies smile with safe, fun, and educational toys! Every giggle matters to us. 👶💕✨
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-purple-300 hover:text-white transition-colors transform hover:scale-110">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-purple-300 hover:text-white transition-colors transform hover:scale-110">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-purple-300 hover:text-white transition-colors transform hover:scale-110">
                  <Instagram className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">🔗 Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/" className="text-purple-200 hover:text-white transition-colors">🏠 Home</a></li>
                <li><a href="/orders" className="text-purple-200 hover:text-white transition-colors">📦 My Orders</a></li>
                <li><a href="/contact" className="text-purple-200 hover:text-white transition-colors">💬 Contact Us</a></li>
                <li><a href="/about" className="text-purple-200 hover:text-white transition-colors">ℹ️ About Us</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">📋 Legal & Safety</h4>
              <ul className="space-y-2">
                <li><a href="/privacy-policy" className="text-purple-200 hover:text-white transition-colors">🔒 Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-purple-200 hover:text-white transition-colors">📜 Terms of Service</a></li>
                <li><a href="/refund-policy" className="text-purple-200 hover:text-white transition-colors">💸 Refund Policy</a></li>
                <li><a href="/shipping-policy" className="text-purple-200 hover:text-white transition-colors">🚚 Shipping Policy</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">📞 Contact Info</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-purple-300 mt-0.5 flex-shrink-0" />
                  <div className="text-purple-100 text-sm">
                    <p>Debayan Ghosh</p>
                    <p>Sutragarh, Lankapara</p>
                    <p>Santipur, Nadia</p>
                    <p>West Bengal - 741404</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-purple-300 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <a href="mailto:debayanghosh408@gmail.com" className="text-purple-200 hover:text-yellow-300 transition-colors text-sm break-all">
                      💌 debayanghosh408@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-purple-300 flex-shrink-0" />
                  <a href="tel:+919609384607" className="text-purple-200 hover:text-yellow-300 transition-colors text-sm">
                    📱 +91 9609384607
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-purple-600 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-purple-200">
                © 2025 felixmart. All rights reserved. Made with 💕 for happy babies!
              </p>
              <p className="text-purple-200 mt-2 md:mt-0">
                🎨 Designed & Developed by Debayan Ghosh
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
