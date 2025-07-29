import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  loading?: boolean;
  onAnimateToCart?: (productImage: string, sourceElement: HTMLElement) => void;
}

export const ProductCard = ({ product, onAddToCart, loading, onAnimateToCart }: ProductCardProps) => {
  const navigate = useNavigate();
  const [primaryImage, setPrimaryImage] = useState<string>(product.image_url || "/placeholder.svg");

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    onAddToCart(product.id);
    
    // Trigger animation if callback provided
    if (onAnimateToCart) {
      onAnimateToCart(primaryImage, e.currentTarget);
    }
  };

  useEffect(() => {
    fetchPrimaryImage();
  }, [product.id]);

  const fetchPrimaryImage = async () => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", product.id)
        .eq("is_primary", true)
        .single();

      if (data && data.image_url) {
        setPrimaryImage(data.image_url);
      } else {
        // If no primary image found, get the first image
        const { data: firstImage } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", product.id)
          .order("display_order", { ascending: true })
          .limit(1)
          .single();

        if (firstImage && firstImage.image_url) {
          setPrimaryImage(firstImage.image_url);
        }
      }
    } catch (error) {
      // Use fallback image if no product images found
      setPrimaryImage(product.image_url || "/placeholder.svg");
    }
  };

  return (
    <Card className="card-premium product-card overflow-hidden group flex flex-col bg-gradient-to-br from-white to-purple-50/30 hover:from-purple-50/50 hover:to-pink-50/50 border-purple-100 transition-all duration-300 h-full max-w-sm mx-auto shadow-lg hover:shadow-xl">
      <div className="relative overflow-hidden w-full aspect-square">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer product-image"
          onClick={() => navigate(`/product/${product.id}`)}
          onError={() => setPrimaryImage("/placeholder.svg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Quick View Button */}
        <Button
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/95 text-purple-600 hover:bg-white shadow-xl backdrop-blur-sm z-10 border border-purple-200"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>

        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white shadow-xl z-10 text-xs">
            Low Stock
          </Badge>
        )}
        {product.stock_quantity === 0 && (
          <Badge className="absolute top-2 right-2 bg-gray-500 text-white shadow-xl z-10 text-xs">
            Out of Stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3 flex-1">
          <div className="flex flex-col gap-2">
            <h3 
              className="font-semibold text-lg line-clamp-2 cursor-pointer hover:text-primary transition-colors leading-tight"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {product.name}
            </h3>
            <Badge variant="secondary" className="self-start text-xs">
              {product.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-purple-100 mt-3">
          <span className="text-xl font-bold text-primary">
            ₹{product.price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            {product.stock_quantity} in stock
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 text-purple-800 hover:from-yellow-500 hover:to-orange-500 font-bold shadow-lg transform hover:scale-[1.02] transition-all duration-200 rounded-full border-none h-11 text-sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stock_quantity === 0 ? "🚫 Out of Stock" : "🛒 Add to Cart"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-full border-2 border-purple-300 text-purple-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:border-purple-400 font-semibold shadow-md transform hover:scale-[1.02] transition-all duration-200 rounded-full h-10 text-sm"
          >
            👀 View Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};