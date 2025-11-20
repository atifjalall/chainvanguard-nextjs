"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  CubeIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Vendor Data
const MOCK_VENDOR = {
  id: "VENDOR001",
  name: "Fashion Store",
  storeName: "Fashion Store - Premium Clothing",
  description:
    "Your destination for premium fashion and style. We offer carefully curated collections of contemporary clothing and accessories.",
  image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
  address: "123 Fashion Street, New York, NY 10001",
  rating: 4.8,
  totalReviews: 256,
  totalProducts: 45,
  totalSales: 1234,
  joinedDate: "2023-01-15",
  verified: true,
};

// Mock Products
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    price: 29.99,
    costPrice: 49.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    category: "T-Shirts",
    inStock: true,
    rating: 4.5,
    reviews: 23,
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    price: 89.99,
    costPrice: 129.99,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    category: "Jackets",
    inStock: true,
    rating: 4.8,
    reviews: 45,
  },
  {
    id: 3,
    name: "Casual Sneakers",
    price: 79.99,
    costPrice: 119.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    category: "Shoes",
    inStock: true,
    rating: 4.6,
    reviews: 34,
  },
  {
    id: 4,
    name: "Summer Dress",
    price: 59.99,
    costPrice: 89.99,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
    category: "Dresses",
    inStock: false,
    rating: 4.7,
    reviews: 28,
  },
  {
    id: 5,
    name: "Leather Wallet",
    price: 39.99,
    costPrice: 59.99,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    category: "Accessories",
    inStock: true,
    rating: 4.9,
    reviews: 56,
  },
  {
    id: 6,
    name: "Sport Watch",
    price: 149.99,
    costPrice: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    category: "Accessories",
    inStock: true,
    rating: 4.8,
    reviews: 42,
  },
];

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: number;
    costPrice?: number;
    image: string;
    category: string;
    inStock: boolean;
    rating: number;
    reviews: number;
  };
}

function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group">
      {/* Product Image */}
      <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden mb-4">
        <div
          className="cursor-pointer"
          onClick={() => router.push(`/customer/products/${product.id}`)}
        >
          {!imageError ? (
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
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

          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <button
          onClick={() => router.push(`/customer/products/${product.id}`)}
          className="block w-full text-left"
        >
          <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {product.name}
          </h3>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <StarIcon className="h-3 w-3 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
            <span className="text-xs text-gray-900 dark:text-white">
              {product.rating}
            </span>
          </div>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            ${product.price.toFixed(2)}
          </span>
          {product.costPrice && product.costPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              ${product.costPrice.toFixed(2)}
            </span>
          )}
        </div>

        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {product.category}
        </p>
      </div>
    </div>
  );
}

export default function VendorStorePage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id || "VENDOR001";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "price-low" | "price-high" | "popular"
  >("newest");

  const vendor = MOCK_VENDOR;
  const [products] = useState(MOCK_PRODUCTS);

  // Filter and sort products
  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <button
              onClick={() => router.push("/customer/browse")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Browse
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {vendor.name}
            </span>
          </div>
        </div>
      </div>

      {/* Store Header */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {/* Store Banner */}
          <div className="relative h-64 bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <img
              src={vendor.image}
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Store Info */}
          <div className="py-12 space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  {vendor.verified && (
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  )}
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    {vendor.storeName}
                  </h1>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl font-light leading-relaxed">
                  {vendor.description}
                </p>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{vendor.address}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.rating}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Rating
                </p>
              </div>
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.totalReviews}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Reviews
                </p>
              </div>
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.totalProducts}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Products
                </p>
              </div>
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.totalSales}+
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Sales
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Sort */}
      <section className="py-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600" />
                <input
                  type="text"
                  placeholder="Search in this store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-8 pr-4 border-b border-gray-900 dark:border-white bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy("newest")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  sortBy === "newest"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  sortBy === "popular"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy("price-low")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  sortBy === "price-low"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Price: Low
              </button>
              <button
                onClick={() => setSortBy("price-high")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  sortBy === "price-high"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Price: High
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {filteredProducts.length > 0 ? (
            <>
              <div className="mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredProducts.length} of {products.length}{" "}
                  products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-32 border border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extralight text-gray-900 dark:text-white">
                    No Products Found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your search
                  </p>
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Store Information */}
      <section className="py-16 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid md:grid-cols-2 gap-16">
            {/* About */}
            <div>
              <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-6">
                About This Store
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {vendor.description}
                </p>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Member since {formatDate(vendor.joinedDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Verified Vendor
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Policies */}
            <div>
              <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-6">
                Store Policies
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-2 uppercase tracking-[0.2em]">
                    Returns
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    30-day return policy on all items
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-2 uppercase tracking-[0.2em]">
                    Shipping
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Free shipping on orders over $50
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900 dark:text-white mb-2 uppercase tracking-[0.2em]">
                    Payment
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Secure blockchain wallet payments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
