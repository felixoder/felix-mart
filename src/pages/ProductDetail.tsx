import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { CartSidebar } from "@/components/CartSidebar";
import { ImageGallery } from "@/components/ImageGallery";
import { ReviewSection } from "@/components/ReviewSection";
import { User } from "@supabase/supabase-js";
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  ArrowLeft, 
  Star,
  Package,
  Clock
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  created_at: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

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

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchProductImages();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          navigate('/404');
          return;
        }
        throw error;
      }

      setProduct(data);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductImages = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      setProductImages(data || []);
    } catch (error) {
      console.error("Error fetching product images:", error);
      // Don't show error for images, fallback to main product image
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

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    setAddingToCart(true);

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .single();

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: quantity,
          });

        if (error) throw error;
      }

      getCartItemsCount(user.id);
      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.name} added to your cart`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Product link copied to clipboard",
        });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} cartItemsCount={cartItemsCount} onCartClick={() => setIsCartOpen(true)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded"></div>
                <div className="h-6 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <CartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          userId={user?.id || null}
        />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Prepare images for gallery (use product images if available, otherwise fallback to main image)
  const galleryImages = productImages.length > 0 
    ? productImages 
    : [{
        id: 'main',
        image_url: product.image_url,
        alt_text: product.name,
        is_primary: true,
        display_order: 0
      }];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} cartItemsCount={cartItemsCount} onCartClick={() => setIsCartOpen(true)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </button>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <ImageGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-primary">
                  ₹{product.price.toFixed(2)}
                </span>
                <Badge 
                  variant={product.stock_quantity > 10 ? "default" : product.stock_quantity > 0 ? "destructive" : "outline"}
                >
                  {product.stock_quantity > 10 
                    ? "In Stock" 
                    : product.stock_quantity > 0 
                    ? `Only ${product.stock_quantity} left` 
                    : "Out of Stock"
                  }
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Quantity:</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || addingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? "Adding..." : product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            <Separator />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Truck className="h-5 w-5 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium">Fast Delivery</div>
                  <div className="text-muted-foreground">3-5 business days</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium">Secure Payment</div>
                  <div className="text-muted-foreground">100% Protected</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
                <div className="text-sm">
                  <div className="font-medium">Quality Assured</div>
                  <div className="text-muted-foreground">Premium materials</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <h3 className="text-lg font-semibold mb-4">Product Description</h3>
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {product.description || "No description available for this product."}
                  </p>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Product Details</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Category: {product.category}</li>
                        <li>Stock: {product.stock_quantity} units available</li>
                        <li>Added: {new Date(product.created_at).toLocaleDateString()}</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Shipping Info</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Free shipping on orders over ₹500</li>
                        <li>Standard delivery: 3-5 business days</li>
                        <li>Express delivery available</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <ReviewSection productId={product.id} user={user} />
          </TabsContent>
        </Tabs>
      </div>
      
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        userId={user?.id || null}
      />
    </div>
  );
};

export default ProductDetail;
