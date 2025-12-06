/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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
import { usePageTitle } from "@/hooks/use-page-title";
import { vendorAPI, VendorStore, VendorProduct } from "@/lib/api/vendor.api";

interface ProductCardProps {
  product: VendorProduct;
}

function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mainImage =
    product.images?.find((img) => img.isMain) || product.images?.[0];
  const isInStock = product.stock > 0;

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
          className="cursor-pointer w-full h-full"
          onClick={() => router.push(`/customer/product/${product._id}`)}
        >
          {mainImage && !imageError ? (
            <img
              src={mainImage.url}
              alt={product.name}
              className={`w-full h-full transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ objectFit: "cover", objectPosition: "center" }}
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

          {!isInStock && (
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
          onClick={() => router.push(`/customer/product/${product._id}`)}
          className="block w-full text-left cursor-pointer"
        >
          <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            {product.name}
          </h3>
        </button>

        <div className="flex items-baseline gap-2">
          <span className="text-xs font-normal text-gray-900 dark:text-white">
            {product.price.toFixed(2)} CVT
          </span>
        </div>

        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {product.category}
        </p>
      </div>
    </div>
  );
}

export default function VendorStorePage() {
  usePageTitle("Vendor Profile");
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.id as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "name">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [vendor, setVendor] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Fetch vendor store information
  useEffect(() => {
    const fetchVendorStore = async () => {
      try {
        setLoading(true);
        const response = await vendorAPI.getVendorStore(vendorId);
        if (response.success) {
          setVendor(response.store);
        }
      } catch (error: any) {
        console.error("Error fetching vendor store:", error);
        toast.error(error.message || "Failed to load vendor store");
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorStore();
    }
  }, [vendorId]);

  // Fetch vendor products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log("🔍 Fetching products for vendor:", vendorId);
        setLoadingProducts(true);
        const response = await vendorAPI.getVendorProducts(vendorId, {
          search: searchQuery || undefined,
          sortBy:
            sortBy === "createdAt"
              ? "createdAt"
              : sortBy === "name"
                ? "name"
                : "price",
          sortOrder,
          page: currentPage,
          limit: 20,
        });

        console.log("📦 Products API Response:", response);
        console.log("✅ Products count:", response.products?.length);
        console.log("✅ First product:", response.products?.[0]);

        if (response.success) {
          setProducts(response.products);
          setTotalPages(response.pagination.pages);
          setTotalProducts(response.pagination.total);
          console.log(
            "✅ Products state updated:",
            response.products.length,
            "products"
          );
        }
      } catch (error: any) {
        console.error("❌ Error fetching vendor products:", error);
        toast.error(error.message || "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    if (vendorId) {
      fetchProducts();
    }
  }, [vendorId, searchQuery, sortBy, sortOrder, currentPage]);

  // Handle sort changes
  const handleSortChange = (
    newSort: "newest" | "price-low" | "price-high" | "popular"
  ) => {
    switch (newSort) {
      case "newest":
        setSortBy("createdAt");
        setSortOrder("desc");
        break;
      case "price-low":
        setSortBy("price");
        setSortOrder("asc");
        break;
      case "price-high":
        setSortBy("price");
        setSortOrder("desc");
        break;
      case "popular":
        setSortBy("name");
        setSortOrder("asc");
        break;
    }
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getCurrentSort = () => {
    if (sortBy === "createdAt" && sortOrder === "desc") return "newest";
    if (sortBy === "price" && sortOrder === "asc") return "price-low";
    if (sortBy === "price" && sortOrder === "desc") return "price-high";
    return "newest";
  };

  if (loading || !vendor) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading vendor store...
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {vendor.vendor.name}
            </span>
          </div>
        </div>
      </div>

      {/* Store Header */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {/* Store Banner */}
          <div className="relative h-64 bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {vendor.vendor.banner ? (
              <img
                src={vendor.vendor.banner}
                alt={vendor.vendor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=400&fit=crop"
                alt="Store banner"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Store Info */}
          <div className="py-12 space-y-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    {vendor.vendor.companyName || vendor.vendor.name}
                  </h1>
                </div>

                {vendor.vendor.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl font-light leading-relaxed">
                    {vendor.vendor.description}
                  </p>
                )}

                {vendor.vendor.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{vendor.vendor.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.stats.recentOrders}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Recent Orders
                </p>
              </div>
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.stats.productCount}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                  Products
                </p>
              </div>
              <div>
                <p className="text-2xl font-extralight text-gray-900 dark:text-white mb-1">
                  {vendor.stats.totalSales}+
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
                onClick={() => handleSortChange("newest")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors cursor-pointer ${
                  sortBy === "createdAt" && sortOrder === "desc"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => handleSortChange("popular")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors cursor-pointer ${
                  sortBy === "name"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => handleSortChange("price-low")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors cursor-pointer ${
                  sortBy === "price" && sortOrder === "asc"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Price: Low
              </button>
              <button
                onClick={() => handleSortChange("price-high")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors cursor-pointer ${
                  sortBy === "price" && sortOrder === "desc"
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
          {(() => {
            console.log("🎨 Render - products:", products);
            console.log("🎨 Render - products.length:", products?.length);
            console.log("🎨 Render - loadingProducts:", loadingProducts);
            return null;
          })()}

          {loadingProducts ? (
            <div className="text-center py-32">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Loading products...
              </p>
            </div>
          ) : products && products.length > 0 ? (
            <>
              <div className="mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {products.length} of {totalProducts} products
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16 flex justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-11 px-6 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="h-11 px-6 flex items-center text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-11 px-6 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
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
                  className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
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
                  {vendor.vendor.description || "No description available."}
                </p>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Member since {formatDate(vendor.vendor.memberSince)}
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
