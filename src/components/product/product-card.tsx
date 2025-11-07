"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/_ui/card";
import { Badge } from "@/components/_ui/badge";
import { Button } from "@/components/_ui/button";
import {
  Heart,
  ShoppingCart,
  Eye,
  Star,
  TrendingUp,
  Sparkles,
  Package,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  description,
  price,
  costPrice,
  images,
  category,
  subcategory,
  brand,
  rating = 0,
  reviewCount = 0,
  inStock = true,
  quantity = 0,
  isFeatured = false,
  isNewArrival = false,
  isBestseller = false,
  isSustainable = false,
  freeShipping = false,
  discount,
  size,
  color,
  fit,
  material,
  pattern,
  sku,
  manufacturer,
  countryOfOrigin,
  certifications,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  variant = "default",
  showActions = true,
  href,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  // ✅ Force re-render when images change
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
    setImageKey((prev) => prev + 1); // Force image reload
  }, [images]);

  const discountPercentage =
    discount ||
    (costPrice && price < costPrice
      ? Math.round(((costPrice - price) / costPrice) * 100)
      : 0);

  const isLowStock = quantity > 0 && quantity <= 5;
  const isOutOfStock = !inStock || quantity === 0;

  // Stock status color and text
  const getStockStatus = () => {
    if (isOutOfStock)
      return {
        color: "text-red-600 dark:text-red-400",
        text: "Out of Stock",
        bg: "bg-red-50 dark:bg-red-950/30",
      };
    if (isLowStock)
      return {
        color: "text-orange-600 dark:text-orange-400",
        text: `Only ${quantity} left`,
        bg: "bg-orange-50 dark:bg-orange-950/30",
      };
    if (quantity <= 20)
      return {
        color: "text-yellow-600 dark:text-yellow-400",
        text: `${quantity} in stock`,
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
      };
    return {
      color: "text-green-600 dark:text-green-400",
      text: "In Stock",
      bg: "bg-green-50 dark:bg-green-950/30",
    };
  };

  const stockStatus = getStockStatus();

  const handleMouseEnter = () => {
    if (images && images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  // ✅ Get safe image source with error handling
  const getImageSrc = () => {
    if (!images || images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }

    const imageUrl = images[currentImageIndex];
    if (!imageUrl || typeof imageUrl !== "string") {
      return "/placeholder-product.png";
    }

    // Image URL should already have timestamp from backend
    return imageUrl;
  };

  const CardWrapper = href ? Link : "div";

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 flex items-center justify-center">
      <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={cn(
          "group relative overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 h-full flex flex-col rounded-2xl p-0"
        )}
      >
        {/* Image Section - Full top area with curved bottom */}
        <CardWrapper
          href={href || `/products/${id}`}
          className="relative block"
        >
          <div
            className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ borderRadius: "0 0 2rem 2rem" }}
          >
            {/* ✅ Image with proper error handling and cache busting */}
            {!imageError && images && images.length > 0 ? (
              <img
                key={`${imageKey}-${currentImageIndex}`} // ✅ Force re-render with key
                src={getImageSrc()}
                alt={name}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  console.error(`Failed to load image for product: ${name}`);
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <PlaceholderImage />
            )}

            {/* Loading Skeleton */}
            {!imageLoaded && !imageError && images && images.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse" />
            )}

            {/* Badges - Top Left */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
              {isNewArrival && (
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
              {isBestseller && (
                <Badge className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Bestseller
                </Badge>
              )}
              {isFeatured && (
                <Badge className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              {isSustainable && (
                <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                  <Leaf className="h-3 w-3 mr-1" />
                  Eco
                </Badge>
              )}
            </div>

            {/* Discount Badge - Top Right */}
            {discountPercentage > 0 && !isInWishlist && (
              <Badge className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white shadow-lg z-10">
                -{discountPercentage}%
              </Badge>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                <Badge
                  variant="secondary"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm px-4 py-2"
                >
                  Out of Stock
                </Badge>
              </div>
            )}

            {/* Wishlist Button */}
            {showActions && (
              <Button
                size="sm"
                variant="secondary"
                className={cn(
                  "absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-lg z-20",
                  isInWishlist && "opacity-100"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleWishlist?.(id);
                }}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isInWishlist
                      ? "fill-red-500 text-red-500"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                />
              </Button>
            )}
          </div>
        </CardWrapper>

        {/* Content Section */}
        <CardHeader className="flex-1 p-3 pb-2">
          <div className="space-y-1.5">
            {/* Category & Brand */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                {category}
              </span>
              {brand && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {brand}
                </span>
              )}
            </div>

            {/* Product Name */}
            <CardWrapper
              href={href || `/products/${id}`}
              className="block group/link"
            >
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                {name}
              </h3>
            </CardWrapper>

            {/* Description (if provided) */}
            {description && variant === "detailed" && (
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {description}
              </p>
            )}

            {/* Price Section */}
            <div className="flex items-baseline gap-2 w-full pt-1">
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                ${price.toFixed(2)}
              </span>
              {costPrice && costPrice > price && (
                <span className="text-xs text-muted-foreground line-through">
                  ${costPrice.toFixed(2)}
                </span>
              )}
              {discountPercentage > 0 && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Save {discountPercentage}%
                </span>
              )}
            </div>

            {/* Apparel Details */}
            {(size || color || fit || material) && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {size && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {size}
                  </Badge>
                )}
                {color && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {color}
                  </Badge>
                )}
                {fit && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {fit}
                  </Badge>
                )}
                {material && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {material}
                  </Badge>
                )}
              </div>
            )}

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1 pt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-2.5 w-2.5",
                        i < Math.floor(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {rating.toFixed(1)}
                  {reviewCount > 0 && ` (${reviewCount})`}
                </span>
              </div>
            )}

            {/* Stock Status */}
            <div className={cn("text-xs font-medium pt-1", stockStatus.color)}>
              {stockStatus.text}
            </div>
          </div>
        </CardHeader>

        {/* Footer Section */}
        <CardFooter className="p-3 pt-0 flex flex-col gap-2 items-start">
          {/* Additional Info */}
          <div className="flex items-center gap-2 flex-wrap text-xs w-full">
            {freeShipping && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Package className="h-3 w-3" />
                <span>Free Shipping</span>
              </div>
            )}
            {sku && variant === "detailed" && (
              <span className="text-gray-500 dark:text-gray-400">
                SKU: {sku}
              </span>
            )}
            {certifications && certifications.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-3 w-3" />
                <span>Certified</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {showActions && (
            <Button
              className={cn(
                "w-full text-white py-2 transition-all duration-300",
                isOutOfStock
                  ? "bg-gray-400 cursor-not-allowed hover:bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
              )}
              disabled={isOutOfStock}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isOutOfStock) {
                  onAddToCart?.(id);
                }
              }}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          )}

          {/* Quick View Button (optional) */}
          {variant === "detailed" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = href || `/products/${id}`;
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
