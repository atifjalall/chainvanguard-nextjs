"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  ChevronRightIcon,
  BookmarkIcon,
  PlusIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  getWishlist,
  removeFromWishlist,
  clearWishlist,
  getSimilarProducts,
} from "@/lib/api/customer.wishlist.api";
import { addToCart } from "@/lib/api/customer.cart.api";
import type { Product } from "@/types";

interface WishlistItem {
  _id: string;
  productId: Product;
  notes?: string;
  addedAt: string;
  priceWhenAdded: number;
}

interface SavedItemCardProps {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (productId: string) => void;
}

function SavedItemCard({ item, onRemove, onAddToCart }: SavedItemCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const product = item.productId;
  const isOutOfStock =
    product.inStock !== undefined ? !product.inStock : product.quantity === 0;
  const mainImage =
    product.images?.find((img) => img.isMain)?.url || product.images?.[0]?.url;

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative">
      {/* Product Image */}
      <div className="relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <div
          className="relative w-full aspect-[3/4] cursor-pointer"
          onClick={() => router.push(`/customer/products/${product._id}`)}
        >
          {!imageError && mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
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

          {!imageLoaded && !imageError && mainImage && (
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

        {/* Remove Button */}
        <button
          onClick={() => onRemove(product._id)}
          className="absolute top-1.5 right-1.5 w-4 h-4 bg-white dark:bg-gray-950 flex items-center justify-center transition-colors z-10 cursor-pointer"
        >
          <XMarkIcon className="w-3 h-3 text-gray-900 dark:text-white" />
        </button>

        {/* Add to Cart Button */}
        {!isOutOfStock && (
          <button
            className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product._id);
            }}
          >
            <PlusIcon className="w-3 h-3 text-black dark:text-white" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between mb-0">
          <button
            onClick={() => router.push(`/customer/products/${product._id}`)}
            className="block flex-1 text-left"
          >
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {product.name}
            </h3>
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            Rs {product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              Rs {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Size & Color */}
        {(product.apparelDetails?.size || product.apparelDetails?.color) && (
          <div className="flex items-center gap-2 mt-1">
            {product.apparelDetails?.color && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {product.apparelDetails.color}
              </span>
            )}
            {product.apparelDetails?.size && product.apparelDetails?.color && (
              <span className="text-[10px] text-gray-400">•</span>
            )}
            {product.apparelDetails?.size && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {product.apparelDetails.size}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SimilarProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

function SimilarProductCard({ product, onAddToCart }: SimilarProductCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock =
    product.inStock !== undefined ? !product.inStock : product.quantity === 0;
  const mainImage =
    product.images?.find((img) => img.isMain)?.url || product.images?.[0]?.url;

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative">
      {/* Product Image */}
      <div className="relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
        <div
          className="relative w-full aspect-[3/4] cursor-pointer"
          onClick={() => router.push(`/customer/products/${product.id}`)}
        >
          {!imageError && mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
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

          {!imageLoaded && !imageError && mainImage && (
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

        {/* Add to Cart Button */}
        {!isOutOfStock && (
          <button
            className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer z-10"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product.id); // Changed from product._id to product.id
            }}
          >
            <PlusIcon className="w-3 h-3 text-black dark:text-white" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="pt-1 pb-1">
        <div className="flex items-center justify-between mb-0">
          <button
            onClick={() => router.push(`/customer/products/${product.id}`)} // Changed from product._id to product.id
            className="block flex-1 text-left"
          >
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {product.name}
            </h3>
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            Rs {product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              Rs {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Size & Color */}
        {(product.apparelDetails?.size || product.apparelDetails?.color) && (
          <div className="flex items-center gap-2 mt-1">
            {product.apparelDetails?.color && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {product.apparelDetails.color}
              </span>
            )}
            {product.apparelDetails?.size && product.apparelDetails?.color && (
              <span className="text-[10px] text-gray-400">•</span>
            )}
            {product.apparelDetails?.size && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {product.apparelDetails.size}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SavedItemsPage() {
  const router = useRouter();
  const [savedItems, setSavedItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const response = await getWishlist();
      if (response.success && response.wishlist) {
        setSavedItems(response.wishlist.items);
        // Load similar products after wishlist
        loadSimilarProducts(response.wishlist.items);
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
      toast.error("Failed to load saved items");
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarProducts = async (items: WishlistItem[]) => {
    try {
      setSimilarLoading(true);
      const categories = [
        ...new Set(
          items.map((item) => item.productId.category).filter(Boolean)
        ),
      ];
      let similar: Product[] = [];

      if (categories.length === 1) {
        // All items in same category, fetch from that category
        const category = categories[0];
        if (category) {
          const response = await getSimilarProducts(category);
          if (response.success && response.products) {
            similar = response.products.filter(
              (prod) => !items.some((item) => item.productId._id === prod._id)
            );
          }
        }
      } else {
        // Mixed categories, fetch from all and combine
        for (const category of categories) {
          if (category) {
            const response = await getSimilarProducts(category);
            if (response.success && response.products) {
              const filtered = response.products.filter(
                (prod) => !items.some((item) => item.productId._id === prod._id)
              );
              similar.push(...filtered);
            }
          }
        }
        // Sort by rating descending and take top
        similar.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      // Limit to 5 products
      setSimilarProducts(similar.slice(0, 5));
    } catch (error) {
      console.error("Error loading similar products:", error);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setSavedItems((items) =>
        items.filter((item) => item.productId._id !== productId)
      );
      toast.success("Removed from saved items");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart({
        productId,
        quantity: 1,
      });
      await removeFromWishlist(productId);
      setSavedItems((items) =>
        items.filter((item) => item.productId._id !== productId)
      );
      toast.success("Added to cart and removed from saved items");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const handleClearAll = async () => {
    try {
      await clearWishlist();
      setSavedItems([]);
      toast.success("All items removed");
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      toast.error("Failed to clear wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading saved items...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Saved Items
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Wishlist
                </p>
              </div>
              <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                Saved Items
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {savedItems.length} {savedItems.length === 1 ? "item" : "items"}
              </p>
            </div>

            {savedItems.length > 0 && (
              <button
                onClick={handleClearAll}
                className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Saved Items Grid */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {savedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
              {savedItems.map((item) => (
                <SavedItemCard
                  key={item._id}
                  item={item}
                  onRemove={handleRemove}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  <BookmarkIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  No Saved Items
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Items you save will appear here
                </p>
              </div>
              <button
                onClick={() => router.push("/customer/browse")}
                className="mt-8 bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {savedItems.length > 0 && (
        <section className="py-32 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            <div className="mb-20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  You May Also Like
                </p>
              </div>
              <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                Similar Items
              </h2>
            </div>

            {similarLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Loading similar items...
                </p>
              </div>
            ) : similarProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                {similarProducts.map((product) => (
                  <SimilarProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No similar items found
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
