import { useState, useRef } from "react";

interface ImageMagnifierProps {
  src: string;
  alt: string;
  magnifierSize?: number;
  zoomLevel?: number;
  className?: string;
}

export const ImageMagnifier = ({
  src,
  alt,
  magnifierSize = 200,
  zoomLevel = 2.5,
  className = ""
}: ImageMagnifierProps) => {
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseEnter = () => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setImgSize({
        width: rect.width,
        height: rect.height
      });
    }
    setShowMagnifier(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMagnifierPos({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setShowMagnifier(false);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover cursor-crosshair"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onLoad={() => {
          if (imgRef.current) {
            const rect = imgRef.current.getBoundingClientRect();
            setImgSize({
              width: rect.width,
              height: rect.height
            });
          }
        }}
      />
      
      {showMagnifier && (
        <div
          className="absolute border-2 border-white shadow-lg rounded-lg pointer-events-none z-50"
          style={{
            width: `${magnifierSize}px`,
            height: `${magnifierSize}px`,
            left: `${magnifierPos.x - magnifierSize / 2}px`,
            top: `${magnifierPos.y - magnifierSize / 2}px`,
            backgroundImage: `url(${src})`,
            backgroundSize: `${imgSize.width * zoomLevel}px ${imgSize.height * zoomLevel}px`,
            backgroundPositionX: `${-magnifierPos.x * zoomLevel + magnifierSize / 2}px`,
            backgroundPositionY: `${-magnifierPos.y * zoomLevel + magnifierSize / 2}px`,
            backgroundRepeat: 'no-repeat'
          }}
        />
      )}
    </div>
  );
};
