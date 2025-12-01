/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  CubeIcon,
  BookmarkIcon,
  PlusIcon,
  MinusIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  StarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import {
  getProductDetail,
  getRelatedProducts,
} from "@/lib/api/customer.browse.api";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "@/lib/api/customer.wishlist.api";
import { addToCart } from "@/lib/api/customer.cart.api";
import type { Product } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCart } from "@/components/providers/cart-provider";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { motion } from "framer-motion";

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  costPrice?: number;
  images: string[];
  quantity?: number;
  inStock?: boolean;
  onAddToCart?: (id: string | number) => void;
  onToggleWishlist?: (id: string | number) => void;
  isInWishlist?: boolean;
  vendor?: {
    id?: string | number; // Make id optional to match Product type
    name: string;
  };
}

function ProductCard({
  id,
  name,
  price,
  costPrice,
  images,
  quantity = 0,
  inStock = true,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  vendor,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = !inStock || quantity === 0;

  const getImageSrc = () => {
    if (!images || images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    const img = images[currentImageIndex];
    return typeof img === "string"
      ? img
      : (img as { url?: string }).url || "/placeholder-product.png";
  };

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative w-full">
      <div className="relative bg-gray-100 dark:bg-gray-900 w-full overflow-hidden">
        <a href={`/customer/product/${id}`} className="block cursor-pointer">
          <div className="relative w-full aspect-[3/4]">
            {!imageError && images && images.length > 0 ? (
              <img
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

        {!isOutOfStock && (
          <button
            className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(id);
            }}
          >
            <PlusIcon className="w-3 h-3 text-black dark:text-white" />
          </button>
        )}
      </div>

      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between mb-0">
          <a
            href={`/customer/product/${id}`}
            className="block flex-1 cursor-pointer"
          >
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {name}
            </h3>
          </a>
          <button
            className="flex items-center justify-center hover:border hover:border-gray-300 dark:hover:border-gray-700 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist?.(id);
            }}
          >
            <BookmarkIcon
              className={`w-3 h-3 transition-colors cursor-pointer ${
                isInWishlist
                  ? "fill-black text-black dark:fill-white dark:text-white"
                  : "text-gray-400 hover:text-black dark:hover:text-white"
              }`}
            />
          </button>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            CVT {price.toFixed(2)}
          </span>
          {costPrice && costPrice > price && (
            <span className="text-[10px] text-gray-400 line-through">
              CVT {costPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Removed vendor name display */}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  usePageTitle("Product Details");
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { refreshCartCount, incrementCartCount } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<(number | string)[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Collapsible state for description expand / collapse
  const [descOpen, setDescOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        const [productData, relatedData, wishlistData] = await Promise.all([
          getProductDetail(productId, {
            includeReviews: true,
            includeRelated: false,
            includeVendor: true,
          }),
          getRelatedProducts(productId, 4),
          getWishlist(),
        ]);

        // Add logging here
        console.log("Related products API response:", relatedData);

        if (productData.success && productData.product) {
          setProduct(productData.product as any);
        } else {
          setError("Product not found");
        }

        if (relatedData.success && relatedData.products) {
          // Backend already filters for in-stock products, so no need to filter again
          const inStockProducts = relatedData.products;
          console.log("Setting related products:", inStockProducts);
          setRelatedProducts(inStockProducts);
        }

        if (wishlistData.success && wishlistData.wishlist) {
          const itemIds = wishlistData.wishlist.items.map(
            (item: any) => item.productId._id || item.productId
          );
          setWishlistItems(itemIds);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product && wishlistItems.length >= 0) {
      setIsInWishlist(wishlistItems.includes(product._id || product.id || ""));
    }
  }, [product, wishlistItems]);

  const handleAddToCart = async () => {
    if (!product || (product.quantity || 0) === 0) return;
    try {
      const response = await addToCart({
        productId: product._id || product.id,
        quantity: quantity, // Use the selected quantity
        // Add selectedSize, selectedColor, etc., if available from UI
      });
      if (response.success) {
        toast.success("Added to cart");
        setAddedToCart(true);
        // Immediately update cart count badge for instant feedback
        incrementCartCount(quantity);
        // Refresh in background for accuracy
        refreshCartCount();
        setTimeout(() => setAddedToCart(false), 2000); // Revert after 2 seconds
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const toggleWishlist = async (productId: number | string) => {
    const isCurrentlyInWishlist = wishlistItems.includes(productId);
    // Optimistic update
    setWishlistItems((prev) =>
      isCurrentlyInWishlist
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    toast.success(
      isCurrentlyInWishlist ? "Removed from wishlist" : "Added to wishlist"
    );

    // API call in background
    try {
      if (isCurrentlyInWishlist) {
        await removeFromWishlist(productId.toString());
      } else {
        await addToWishlist(productId.toString());
      }
    } catch (error) {
      // Revert on failure
      setWishlistItems((prev) =>
        isCurrentlyInWishlist
          ? [...prev, productId]
          : prev.filter((id) => id !== productId)
      );
      toast.error("Failed to update wishlist");
      console.error("Error toggling wishlist:", error);
    }
  };

  const handleRelatedAddToCart = async (productId: number | string) => {
    try {
      const response = await addToCart({
        productId: productId.toString(),
        quantity: 1, // Default to 1 for related products
        // Add selectedSize, selectedColor, etc., if available from UI
      });
      if (response.success) {
        toast.success("Added to cart");
        // Immediately refresh cart count to update badge
        await refreshCartCount();
        console.log(
          "[PRODUCT] Cart count refreshed after adding related product"
        );
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const getProductImages = () => {
    if (!product || !product.images || product.images.length === 0) {
      return ["/placeholder-product.png"];
    }
    return product.images.map((img) =>
      typeof img === "string" ? img : img.url || "/placeholder-product.png"
    );
  };

  const getProductDetails = () => {
    if (!product) return [];

    const details = [];

    // Apparel details
    if (product.apparelDetails) {
      const ad = product.apparelDetails;
      if (ad.material) details.push(`Material: ${ad.material}`);
      if (ad.fabricWeight) details.push(`Fabric Weight: ${ad.fabricWeight}`);
      if (ad.careInstructions) details.push(`Care: ${ad.careInstructions}`);
      if (ad.fit) details.push(`Fit: ${ad.fit}`);
      if (ad.neckline) details.push(`Neckline: ${ad.neckline}`);
      if (ad.sleeveLength) details.push(`Sleeve: ${ad.sleeveLength}`);
    }

    // Basic product info
    if (product.brand) details.push(`Brand: ${product.brand}`);
    if (product.season) details.push(`Season: ${product.season}`);
    if (product.countryOfOrigin)
      details.push(`Made in: ${product.countryOfOrigin}`);
    if (product.manufacturer)
      details.push(`Manufacturer: ${product.manufacturer}`);

    return details;
  };

  const getShippingText = () => {
    if (!product) return "Free Shipping";

    const shippingCost = product.shippingCost ?? product.shipping?.cost;
    const isFreeShipping =
      product.freeShipping ?? product.shipping?.isFreeShipping;

    if (isFreeShipping || shippingCost === 0 || shippingCost === undefined) {
      return "Free Shipping";
    }

    return `Shipping: CVT ${shippingCost.toFixed(2)}`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-yellow-500" />
            ) : (
              <StarIcon className="h-4 w-4 text-gray-300 dark:text-gray-700" />
            )}
          </span>
        ))}
      </div>
    );
  };

  // Helper to render multi-paragraph descriptions while fully justifying text.
  // Collapses single newlines into spaces so text flows naturally, splits paragraphs
  // on blank lines, and applies hyphenation/word-breaking to improve justification.
  const renderDescription = (description?: string | null) => {
    if (!description) return null;

    // Normalize CRLF to LF and trim
    const normalized = description.replace(/\r\n/g, "\n").trim();

    // Split by two or more newlines (paragraph separator)
    const rawParagraphs = normalized.split(/\n{2,}/g).map((p) => p.trim());

    // Collapse single newlines inside paragraphs to spaces so text flows naturally
    const paragraphs = rawParagraphs.map((p) => p.replace(/\n+/g, " ").trim());

    return (
      <>
        {paragraphs.map((para, idx) => {
          // Treat as "short" if fewer than ~80 chars or fewer than 8 words,
          // so we avoid full justification that creates large gaps on short lines.
          const wordCount = para.split(/\s+/).filter(Boolean).length;
          const isShort = para.length < 80 || wordCount < 8;

          return (
            <p
              key={idx}
              className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words mb-4"
              style={{
                textAlign: isShort ? "left" : "justify",
                // Avoid justifying the last line — prevents big gaps
                textAlignLast: isShort ? "left" : "start",
                textJustify: "inter-word",
                WebkitHyphens: isShort ? "manual" : "auto",
                hyphens: isShort ? "manual" : "auto",
                overflowWrap: "break-word",
              }}
            >
              {para}
            </p>
          );
        })}
      </>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">
            {error || "Product not found"}
          </p>
          <button
            onClick={() => router.push("/customer/browse")}
            className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline cursor-pointer"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const images = getProductImages();
  const details = getProductDetails();
  const productQuantity = product.quantity ?? 0;
  const isOutOfStock = productQuantity === 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div>
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <button
              onClick={() => router.push("/customer/browse")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Browse
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <button
              onClick={() =>
                router.push(`/customer/browse?category=${product.category}`)
              }
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {product.category}
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Section */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Images */}
            <div className="space-y-4">
              <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-product.png";
                  }}
                />
              </div>

              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setImageLoaded(false);
                      }}
                      className={`relative flex-shrink-0 bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden cursor-pointer transition-all ${
                        selectedImage === index
                          ? "ring-1 ring-black dark:ring-white"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      style={{ width: "140px" }} // Fixed width for thumbnails
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-product.png";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div className="space-y-4 pb-8 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-px w-12 bg-gray-300 dark:bg-gray-700" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    {product.category}
                  </p>
                </div>
                <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  {product.name}
                </h1>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    CVT {product.price.toFixed(2)}
                  </span>
                  {product.costPrice && product.costPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      CVT {product.costPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {product.sellerName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Sold by:{" "}
                    <button
                      onClick={() =>
                        router.push(`/customer/vendor/${product.sellerId}`)
                      }
                      className="hover:text-gray-900 dark:hover:text-white underline cursor-pointer"
                    >
                      {product.sellerName}
                    </button>
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {productQuantity > 0 ? (
                    <>
                      <div className="h-2 w-2 rounded-none bg-green-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {productQuantity <= 5
                          ? `Only ${productQuantity} left`
                          : "In Stock"}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 rounded-none bg-red-500"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Out of Stock
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Removed description from here (moved under Product Details) */}

              {/* Updated: Check for color/size directly, with fallbacks to apparelDetails */}
              {(product.color || product.apparelDetails?.color) && (
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Color:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {product.color || product.apparelDetails?.color}
                  </span>
                </div>
              )}

              {(product.size || product.apparelDetails?.size) && (
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Size:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {product.size || product.apparelDetails?.size}
                  </span>
                </div>
              )}

              {!isOutOfStock && (
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                    Quantity
                  </p>
                  <div className="flex items-center gap-0 w-32 border border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-11 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <MinusIcon className="h-3 w-3" />
                    </button>
                    <div className="flex-1 h-11 flex items-center justify-center text-sm text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-800">
                      {quantity}
                    </div>
                    <button
                      onClick={() =>
                        setQuantity(Math.min(productQuantity, quantity + 1))
                      }
                      disabled={quantity >= productQuantity}
                      className="w-10 h-11 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  {addedToCart ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : isOutOfStock ? (
                    "Out of Stock"
                  ) : (
                    "Add to Cart"
                  )}
                </button>
                <button
                  onClick={() => toggleWishlist(product._id || product.id)}
                  className="w-12 h-12 border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <BookmarkIcon
                    className={`h-4 w-4 ${
                      isInWishlist
                        ? "fill-black text-black dark:fill-white dark:text-white"
                        : "text-black dark:text-white"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center text-center space-y-2">
                  <TruckIcon
                    className="h-5 w-5 text-gray-900 dark:text-white opacity-70"
                    strokeWidth={1.2}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {getShippingText()}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <ShieldCheckIcon
                    className="h-5 w-5 text-gray-900 dark:text-white opacity-70"
                    strokeWidth={1.2}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Secure Payment
                  </span>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <ArrowPathIcon
                    className="h-5 w-5 text-gray-900 dark:text-white opacity-70"
                    strokeWidth={1.2}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {product.estimatedDeliveryDays
                      ? `${product.estimatedDeliveryDays} Days`
                      : "Fast Delivery"}
                  </span>
                </div>
              </div>

              {details.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                    Product Details
                  </p>
                  <ul className="space-y-2">
                    {details.map((detail, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400"
                      >
                        <span className="text-gray-400 dark:text-gray-600 mt-1">
                          •
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Collapsible product description below product details */}
                  {product.description && (
                    <div className="pt-4">
                      <div className="relative">
                        <Collapsible open={descOpen} onOpenChange={setDescOpen}>
                          <div className="flex items-center">
                            {/* Heading as a trigger — clicking text toggles */}
                            <CollapsibleTrigger asChild>
                              <motion.button
                                type="button"
                                aria-label={
                                  descOpen
                                    ? "Collapse description"
                                    : "Expand description"
                                }
                                aria-expanded={descOpen}
                                animate={{
                                  color: descOpen ? "#000000" : undefined,
                                }}
                                className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium leading-none text-left cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                Description
                              </motion.button>
                            </CollapsibleTrigger>

                            {/* Inline icon trigger next to heading — smaller icon-only button */}
                            <CollapsibleTrigger asChild>
                              <motion.button
                                type="button"
                                aria-hidden={false}
                                aria-label={
                                  descOpen
                                    ? "Collapse description"
                                    : "Expand description"
                                }
                                className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white self-center cursor-pointer"
                              >
                                {descOpen ? (
                                  <MinusIcon className="h-3 w-3" />
                                ) : (
                                  <PlusIcon className="h-3 w-3" />
                                )}
                              </motion.button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent isOpen={descOpen}>
                            <div className="pt-3">
                              {renderDescription(product.description)}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If no details exist but a description is present, render the description under the same Product Details block */}
              {details.length === 0 && product.description && (
                <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                    Product Details
                  </p>
                  <div className="pt-4">
                    {/* Reuse collapsible for the standalone description section */}
                    <div className="relative">
                      <Collapsible open={descOpen} onOpenChange={setDescOpen}>
                        <div className="flex items-center">
                          <CollapsibleTrigger asChild>
                            <motion.button
                              aria-label={
                                descOpen
                                  ? "Collapse description"
                                  : "Expand description"
                              }
                              aria-expanded={descOpen}
                              className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium leading-none text-left cursor-pointer hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              Description
                            </motion.button>
                          </CollapsibleTrigger>
                          <CollapsibleTrigger asChild>
                            <motion.button
                              aria-hidden
                              aria-label={
                                descOpen
                                  ? "Collapse description"
                                  : "Expand description"
                              }
                              className="w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white self-center cursor-pointer"
                            >
                              {descOpen ? (
                                <MinusIcon className="h-3 w-3" />
                              ) : (
                                <PlusIcon className="h-3 w-3" />
                              )}
                            </motion.button>
                          </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent isOpen={descOpen}>
                          <div className="pt-3">
                            {renderDescription(product.description)}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {product.reviews && product.reviews.length > 0 && (
        <section className="py-16 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            <div className="mb-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Customer Reviews
                </p>
              </div>
              <h2 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                What Customers Say
              </h2>
            </div>

            <div className="space-y-8">
              {product.reviews.map((review: any) => (
                <div
                  key={review.id || review._id}
                  className="pb-8 border-b border-gray-200 dark:border-gray-800 last:border-b-0"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {review.userName || "Anonymous"}
                        </span>
                      </div>
                      {review.title && (
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {review.title}
                        </h3>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {new Date(
                        review.date || review.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  {renderDescription(review.comment)}
                  {review.isVerifiedPurchase && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        Verified Purchase
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Products */}
      <section className="py-32 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                You May Also Like
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Related Products
            </h2>
          </div>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item._id || item.id}
                  id={item._id || item.id}
                  name={item.name}
                  price={item.price}
                  costPrice={item.costPrice}
                  images={
                    item.images?.map((img) =>
                      typeof img === "string" ? img : img.url
                    ) || []
                  }
                  quantity={item.quantity}
                  inStock={
                    item.inStock !== undefined
                      ? item.inStock
                      : (item.quantity || 0) > 0
                  }
                  onAddToCart={handleRelatedAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isInWishlist={wishlistItems.includes(item._id || item.id)}
                  vendor={item.vendor} // Pass vendor info to ProductCard
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No related products found at this time.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
