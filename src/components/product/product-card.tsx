"use client";

import { useState, useEffect } from "react";
import { BookmarkIcon, PlusIcon, CubeIcon } from "@heroicons/react/24/outline";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  quantity?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isSustainable?: boolean;
  freeShipping?: boolean;
  discount?: number;
  size?: string;
  color?: string;
  fit?: string;
  material?: string;
  pattern?: string;
  sku?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  certifications?: string[];
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  isInWishlist?: boolean;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  href?: string;
}

export function ProductCard({
  id,
  name,
  price,
  costPrice,
  images,
  color,
  quantity = 0,
  inStock = true,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  showActions = true,
  href,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
    setImageKey((prev) => prev + 1);
  }, [images]);

  const isOutOfStock = !inStock || quantity === 0;

  const handleMouseEnter = () => {
    if (images && images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const getImageSrc = () => {
    if (!images || images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    const imageUrl = images[currentImageIndex];
    if (!imageUrl || typeof imageUrl !== "string") {
      return "/placeholder-product.png";
    }
    return imageUrl;
  };

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative w-full">
      {/* Image Container */}
      <div className="relative bg-gray-100 w-full">
        <a href={href || `/products/${id}`} className="block">
          <div
            className="relative w-full aspect-[3/4] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!imageError && images && images.length > 0 ? (
              <img
                key={`${imageKey}-${currentImageIndex}`}
                src={getImageSrc()}
                alt={name}
                className={`w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 transition-transform duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <PlaceholderImage />
            )}

            {!imageLoaded && !imageError && images && images.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </a>

        {/* Plus Button - Bottom Left */}
        {showActions && !isOutOfStock && (
          <button
            className="absolute bottom-3 left-3 w-5 h-5 bg-white flex items-center justify-center opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(id);
            }}
          >
            <PlusIcon className="w-4 h-4 text-black" />
          </button>
        )}

        {/* Heart Button - Moved inline with product name */}
      </div>

      {/* Content Below Image */}
      <div className="pt-2 pb-4">
        {/* Product Name */}
        <div className="flex items-center justify-between mb-1">
          <a href={href || `/products/${id}`} className="block flex-1">
            <h3 className="text-sm font-normal text-black uppercase tracking-wide hover:text-gray-600 transition-colors">
              {name}
            </h3>
          </a>
          {showActions && (
            <button
              className="flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist?.(id);
              }}
            >
              <BookmarkIcon
                className={`w-4 h-4 transition-colors cursor-pointer ${
                  isInWishlist
                    ? "fill-black text-black"
                    : "text-gray-400 hover:text-black"
                }`}
              />
            </button>
          )}
        </div>

        {/* Color Variants */}
        {color && (
          <div className="flex items-center gap-1 mb-1">
            <div className="w-3 h-3 rounded-full bg-gray-400 border border-gray-300" />
            <span className="text-xs text-gray-500">+8</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-normal text-black">
            CVT {price.toFixed(2)}
          </span>
          {costPrice && costPrice > price && (
            <span className="text-xs text-gray-400 line-through">
              CVT {costPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
