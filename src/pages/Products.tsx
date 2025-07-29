import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { CartSidebar } from "@/components/CartSidebar";
import { Store, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

const Products = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchProducts(); // Fetch products for all users
    
    // Set up auth state listener for cart updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          getCartItemsCount(session.user.id);
        } else {
          setUser(null);
          const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
          const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartItemsCount(totalCount);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        
        // Check if user is admin (for display purposes, but don't restrict access)
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        setIsAdmin(profile?.is_admin || false);
        getCartItemsCount(session.user.id);
      } else {
        // Guest users can also view products
        setUser(null);
        setIsAdmin(false);
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartItemsCount(totalCount);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      // Don't redirect on error, just set defaults
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
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
      // Handle guest cart with localStorage
      try {
        const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
        const existingItemIndex = guestCart.findIndex((item: any) => item.product_id === productId);

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity += 1;
        } else {
          guestCart.push({
            product_id: productId,
            quantity: 1,
            added_at: new Date().toISOString(),
          });
        }

        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        const totalCount = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
        setCartItemsCount(totalCount);

        toast({
          title: "Success",
          description: "Product added to cart",
        });
      } catch (error) {
        console.error("Error adding to guest cart:", error);
        toast({
          title: "Error",
          description: "Failed to add product to cart",
          variant: "destructive",
        });
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background products-page">
      <Navbar 
        user={user} 
        cartItemsCount={cartItemsCount} 
        onCartClick={() => setIsCartOpen(true)} 
      />

      <div className="full-width-container px-4 sm:px-6 lg:px-8 xl:px-12 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🧸 All Our Amazing Toys
          </h1>
          <p className="text-muted-foreground text-lg">Discover the complete collection of wonderful toys for your little ones</p>
        </div>

        <div className="mb-8 space-y-6">
          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="🔍 Search for amazing toys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 focus:border-purple-400 rounded-full shadow-md"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              size="sm"
              className={selectedCategory === "all" 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200" 
                : "border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 rounded-full shadow-md transform hover:scale-105 transition-all duration-200"
              }
            >
              🧸 All Products
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
                className={selectedCategory === category 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200" 
                  : "border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 rounded-full shadow-md transform hover:scale-105 transition-all duration-200"
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
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
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAnimateToCart={animateToCart}
              />
            ))}
          </div>
        )}
      </div>

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

export default Products;
