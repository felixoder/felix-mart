import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductImageDisplayProps {
  productId: string;
  fallbackUrl?: string;
  className?: string;
  alt?: string;
}

export const ProductImageDisplay = ({ 
  productId, 
  fallbackUrl = "/placeholder.svg", 
  className = "",
  alt = "Product image"
}: ProductImageDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);

  useEffect(() => {
    fetchPrimaryImage();
  }, [productId]);

  const fetchPrimaryImage = async () => {
    try {
      const { data, error } = await supabase
        .from("product_images")
        .select("image_url")
        .eq("product_id", productId)
        .eq("is_primary", true)
        .single();

      if (data && data.image_url) {
        setImageUrl(data.image_url);
      } else {
        // If no primary image found, get the first image
        const { data: firstImage } = await supabase
          .from("product_images")
          .select("image_url")
          .eq("product_id", productId)
          .order("display_order", { ascending: true })
          .limit(1)
          .single();

        if (firstImage && firstImage.image_url) {
          setImageUrl(firstImage.image_url);
        }
      }
    } catch (error) {
      // Use fallback image if no product images found
      setImageUrl(fallbackUrl);
    }
  };

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => setImageUrl(fallbackUrl)}
    />
  );
};
