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
}

export const ProductCard = ({ product, onAddToCart, loading }: ProductCardProps) => {
  const navigate = useNavigate();
  const [primaryImage, setPrimaryImage] = useState<string>(product.image_url || "/placeholder.svg");

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
    <Card className="card-premium overflow-hidden group">
      <div className="relative overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
          onError={() => setPrimaryImage("/placeholder.svg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Quick View Button */}
        <Button
          size="sm"
          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>

        {product.stock_quantity < 10 && product.stock_quantity > 0 && (
          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
            Low Stock
          </Badge>
        )}
        {product.stock_quantity === 0 && (
          <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground">
            Out of Stock
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 
              className="font-semibold text-lg line-clamp-1 cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              {product.name}
            </h3>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {product.category}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ₹{product.price.toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              {product.stock_quantity} in stock
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 space-y-2">
        <Button
          onClick={() => onAddToCart(product.id)}
          disabled={product.stock_quantity === 0 || loading}
          className="w-full btn-premium"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock_quantity === 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/product/${product.id}`)}
          className="w-full"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};