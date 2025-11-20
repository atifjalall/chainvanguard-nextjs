"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  ChevronRightIcon,
  BookmarkIcon,
  PlusIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Saved Items Data
const INITIAL_SAVED_ITEMS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    category: "Men",
    price: 29.99,
    costPrice: 49.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    size: "M",
    color: "Black",
    inStock: true,
    quantity: 50,
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    category: "Women",
    price: 89.99,
    costPrice: 129.99,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    size: "L",
    color: "Blue",
    inStock: true,
    quantity: 30,
  },
  {
    id: 3,
    name: "Casual Sneakers",
    category: "Unisex",
    price: 79.99,
    costPrice: 119.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    size: "42",
    color: "White",
    inStock: true,
    quantity: 45,
  },
  {
    id: 4,
    name: "Summer Dress",
    category: "Women",
    price: 59.99,
    costPrice: 89.99,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
    size: "S",
    color: "Floral",
    inStock: false,
    quantity: 0,
  },
  {
    id: 5,
    name: "Leather Wallet",
    category: "Accessories",
    price: 39.99,
    costPrice: 59.99,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    color: "Brown",
    inStock: true,
    quantity: 60,
  },
  {
    id: 6,
    name: "Sport Watch",
    category: "Accessories",
    price: 149.99,
    costPrice: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    color: "Silver",
    inStock: true,
    quantity: 15,
  },
];

interface SavedItemCardProps {
  item: {
    id: number;
    name: string;
    category: string;
    price: number;
    costPrice?: number;
    image: string;
    size?: string;
    color: string;
    inStock: boolean;
    quantity: number;
  };
  onRemove: (id: number) => void;
  onAddToCart: (id: number) => void;
}

function SavedItemCard({ item, onRemove, onAddToCart }: SavedItemCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = !item.inStock || item.quantity === 0;

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative">
      {/* Product Image */}
      <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden">
        <div
          className="cursor-pointer"
          onClick={() => router.push(`/customer/products/${item.id}`)}
        >
          {!imageError ? (
            <img
              src={item.image}
              alt={item.name}
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

          {!imageLoaded && !imageError && (
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
          onClick={() => onRemove(item.id)}
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
              onAddToCart(item.id);
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
            onClick={() => router.push(`/customer/products/${item.id}`)}
            className="block flex-1 text-left"
          >
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {item.name}
            </h3>
          </button>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            Rs {item.price.toFixed(2)}
          </span>
          {item.costPrice && item.costPrice > item.price && (
            <span className="text-[10px] text-gray-400 line-through">
              Rs {item.costPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Size & Color */}
        {(item.size || item.color) && (
          <div className="flex items-center gap-2 mt-1">
            {item.color && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {item.color}
              </span>
            )}
            {item.size && item.color && (
              <span className="text-[10px] text-gray-400">•</span>
            )}
            {item.size && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {item.size}
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
  const [savedItems, setSavedItems] = useState(INITIAL_SAVED_ITEMS);

  const handleRemove = (id: number) => {
    setSavedItems((items) => items.filter((item) => item.id !== id));
    toast.success("Removed from saved items");
  };

  const handleAddToCart = (id: number) => {
    toast.success("Added to cart");
  };

  const handleClearAll = () => {
    setSavedItems([]);
    toast.success("All items removed");
  };

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
                  key={item.id}
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

            <div className="text-center py-16">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Recommendations will appear here
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
