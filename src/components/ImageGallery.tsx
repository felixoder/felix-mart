import { useState } from "react";
import { ImageMagnifier } from "./ImageMagnifier";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export const ImageGallery = ({ images, productName }: ImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Sort images by display_order and put primary image first
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.display_order || 0) - (b.display_order || 0);
  });

  const currentImage = sortedImages[selectedImageIndex];

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? sortedImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => 
      prev === sortedImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!sortedImages.length) {
    return (
      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
        <img 
          src="/placeholder.svg" 
          alt={productName}
          className="w-32 h-32 object-cover opacity-50"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-lg overflow-hidden bg-white border">
        <ImageMagnifier
          src={currentImage.image_url}
          alt={currentImage.alt_text || productName}
          className="w-full h-full"
        />
        
        {sortedImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image Counter */}
        {sortedImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {selectedImageIndex + 1} / {sortedImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedImageIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <img
                src={image.image_url}
                alt={image.alt_text || `${productName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
