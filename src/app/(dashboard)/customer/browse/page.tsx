"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  BookmarkIcon,
  PlusIcon,
  FunnelIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { browseProducts } from "@/lib/api/customer.browse.api";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "@/lib/api/customer.wishlist.api";
import { addToCart } from "@/lib/api/customer.cart.api";
import type { Product } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCart } from "@/components/providers/cart-provider";

// Product Card Component
interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  costPrice?: number;
  images: string[];
  category?: string;
  quantity?: number;
  inStock?: boolean;
  onAddToCart?: (id: string | number) => void;
  onToggleWishlist?: (id: string | number) => void;
  isInWishlist?: boolean;
  showActions?: boolean;
}

function ProductCard({
  id,
  name,
  price,
  costPrice,
  images,
  category,
  quantity = 0,
  inStock = true,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  showActions = true,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Use inStock prop directly - backend already calculated this
  const isOutOfStock = !inStock;

  const getImageSrc = () => {
    if (!images || images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    return images[currentImageIndex] || "/placeholder-product.png";
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

        {showActions && !isOutOfStock && (
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
          {showActions && (
            <button
              className="flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist?.(id);
              }}
            >
              <BookmarkIcon
                className={`w-3 h-3 transition-colors ${
                  isInWishlist
                    ? "fill-black text-black dark:fill-white dark:text-white"
                    : "text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              />
            </button>
          )}
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
      </div>
    </div>
  );
}

// Category Structure
const APPAREL_CATEGORIES = {
  Men: {
    label: "Men",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Hoodies",
      "Sweaters",
      "Jackets",
      "Coats",
      "Jeans",
      "Trousers",
      "Shorts",
      "Suits",
      "Kurta",
      "Shalwar Kameez",
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
  },
  Women: {
    label: "Women",
    subcategories: [
      "T-Shirts",
      "Blouses",
      "Shirts",
      "Dresses",
      "Skirts",
      "Jeans",
      "Trousers",
      "Shorts",
      "Jackets",
      "Coats",
      "Sweaters",
      "Hoodies",
      "Suits",
      "Jumpsuits",
      "Shalwar Kameez",
      "Kurta",
      "Lawn Suits",
      "Sarees",
      "Lehenga",
      "Dupatta",
      "Shawls",
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
  },
  Kids: {
    label: "Kids",
    subcategories: [
      "T-Shirts",
      "Shirts",
      "Sweaters",
      "Hoodies",
      "Jeans",
      "Trousers",
      "Shorts",
      "Dresses",
      "Jackets",
      "Coats",
      "Kurta",
      "Shalwar Kameez",
      "Activewear",
      "Sleepwear",
      "Swimwear",
      "Underwear",
    ],
  },
  Unisex: {
    label: "Unisex",
    subcategories: [
      "T-Shirts",
      "Hoodies",
      "Sweaters",
      "Jackets",
      "Activewear",
      "Sleepwear",
      "Swimwear",
    ],
  },
};

const SORT_OPTIONS = [
  { label: "Latest", value: "createdAt-desc" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
];

export default function BrowsePage() {
  usePageTitle("Browse Products");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { incrementCartCount } = useCart();

  // State
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  // New filters
  const [isFeatured, setIsFeatured] = useState<boolean | undefined>(undefined);
  const [isNewArrival, setIsNewArrival] = useState<boolean | undefined>(
    undefined
  );
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1,
  });

  // Set filters from URL on mount
  useEffect(() => {
    const categoryFromUrl = searchParams?.get("category");
    const subcategoryFromUrl = searchParams?.get("subcategory");
    const featuredFromUrl = searchParams?.get("featured");
    const newArrivalFromUrl = searchParams?.get("newArrival");
    const seasonFromUrl = searchParams?.get("season");

    if (categoryFromUrl) {
      const formattedCategory =
        categoryFromUrl.charAt(0).toUpperCase() + categoryFromUrl.slice(1);
      setSelectedCategory(formattedCategory);
    }

    if (subcategoryFromUrl) {
      const formattedSubcategory = subcategoryFromUrl
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
      setSelectedSubcategory(formattedSubcategory);
    }

    if (featuredFromUrl === "true") {
      setIsFeatured(true);
    }

    if (newArrivalFromUrl === "true") {
      setIsNewArrival(true);
    }

    if (seasonFromUrl) {
      setSelectedSeason(seasonFromUrl);
    }
  }, [searchParams]);

  // Load wishlist on mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const response = await getWishlist();
        if (response.success && response.wishlist) {
          setWishlist(
            response.wishlist.items.map((item) => item.productId._id)
          );
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
      }
    };
    loadWishlist();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sortField, sortOrder] = sortBy.split("-") as [
          string,
          "asc" | "desc",
        ];

        const response = await browseProducts({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          subcategory: selectedSubcategory || undefined,
          isFeatured: isFeatured,
          isNewArrival: isNewArrival,
          season: selectedSeason || undefined,
          sortBy: sortField,
          sortOrder: sortOrder,
          page: pagination.page,
          limit: pagination.limit,
        });

        if (response.success && response.products) {
          setProducts(response.products);
          if (response.pagination) {
            setPagination(response.pagination);
          }
        } else {
          setError("Failed to load products");
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [
    selectedCategory,
    selectedSubcategory,
    isFeatured,
    isNewArrival,
    selectedSeason,
    sortBy,
    pagination.page,
    pagination.limit,
  ]);

  const toggleWishlist = async (productId: number | string) => {
    const isCurrentlyInWishlist = wishlist.includes(productId);
    // Optimistic update
    setWishlist((prev) =>
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
      setWishlist((prev) =>
        isCurrentlyInWishlist
          ? [...prev, productId]
          : prev.filter((id) => id !== productId)
      );
      toast.error("Failed to update wishlist");
      console.error("Error toggling wishlist:", error);
    }
  };

  const handleAddToCart = async (productId: number | string) => {
    try {
      const response = await addToCart({
        productId: productId.toString(),
        quantity: 1, // Default to 1; adjust if you want user input
        // Add selectedSize, selectedColor, etc., if available from UI
      });
      if (response.success) {
        toast.success("Added to cart");
        // Immediately update cart badge for instant feedback
        incrementCartCount(1);
      } else {
        toast.error("Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  // Get categories list
  const categories = ["All", ...Object.keys(APPAREL_CATEGORIES)];

  // Get subcategories for selected category
  const subcategories =
    selectedCategory !== "All" &&
    APPAREL_CATEGORIES[selectedCategory as keyof typeof APPAREL_CATEGORIES]
      ? APPAREL_CATEGORIES[selectedCategory as keyof typeof APPAREL_CATEGORIES]
          .subcategories
      : [];

  // Convert Product to ProductCard format
  const convertToCardFormat = (product: Product) => {
    return {
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      costPrice: product.costPrice || product.originalPrice,
      images:
        product.images?.map((img) =>
          typeof img === "string" ? img : img.url
        ) || [],
      category: product.category,
      quantity: product.quantity,
      // Use backend's inStock value directly
      inStock:
        product.inStock !== undefined ? product.inStock : product.quantity > 0,
    };
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/customer")}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
            Browse
          </span>
        </div>
      </div>

      {/* Hero Header */}
      <section className="relative border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-20">
          <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 font-light">
                Collection
              </p>
            </div>
            <h1 className="text-6xl lg:text-7xl font-extralight text-gray-900 dark:text-white tracking-tight leading-none">
              All Products
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              {loading ? "Loading..." : `${pagination.total} items`}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-center justify-between h-16">
            {/* Categories */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedSubcategory(null);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    if (category === "All") {
                      router.push("/customer/browse");
                    } else {
                      router.push(
                        `/customer/browse?category=${category.toLowerCase()}`
                      );
                    }
                  }}
                  className={`px-5 h-10 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all duration-300 cursor-pointer ${
                    selectedCategory === category
                      ? "text-gray-900 dark:text-white border-b-2 border-black dark:border-white"
                      : "text-gray-400 dark:text-gray-600 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Sort & Subcategory */}
            <div className="flex items-center gap-4 ml-6">
              {/* Subcategory Dropdown */}
              {subcategories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setSubcategoryOpen(!subcategoryOpen)}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
                  >
                    {selectedSubcategory || "Category"}
                  </button>

                  {subcategoryOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 cursor-pointer"
                        onClick={() => setSubcategoryOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50 max-h-[400px] overflow-y-auto">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setSelectedSubcategory(null);
                              setSubcategoryOpen(false);
                              setPagination((prev) => ({ ...prev, page: 1 }));
                              router.push(
                                `/customer/browse?category=${selectedCategory.toLowerCase()}`
                              );
                            }}
                            className={`block w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer ${
                              !selectedSubcategory
                                ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                            }`}
                          >
                            All
                          </button>
                          {subcategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => {
                                setSelectedSubcategory(sub);
                                setSubcategoryOpen(false);
                                setPagination((prev) => ({ ...prev, page: 1 }));
                                router.push(
                                  `/customer/browse?category=${selectedCategory.toLowerCase()}&subcategory=${sub.toLowerCase()}`
                                );
                              }}
                              className={`block w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer ${
                                selectedSubcategory === sub
                                  ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors cursor-pointer"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Sort
                </button>

                {filtersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-pointer"
                      onClick={() => setFiltersOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50">
                      <div className="p-2">
                        {SORT_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setFiltersOpen(false);
                              setPagination((prev) => ({ ...prev, page: 1 }));
                            }}
                            className={`block w-full text-left px-4 py-3 text-xs transition-colors cursor-pointer ${
                              sortBy === option.value
                                ? "text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {loading ? (
            <div className="text-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Loading products...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-32">
              <p className="text-sm text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
              {products.map((product) => {
                const cardData = convertToCardFormat(product);
                return (
                  <ProductCard
                    key={cardData.id}
                    {...cardData}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={toggleWishlist}
                    isInWishlist={wishlist.includes(cardData.id)}
                    showActions={true}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-32">
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  No products found
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedSubcategory(null);
                    setSortBy("createdAt-desc");
                    setPagination((prev) => ({ ...prev, page: 1 }));
                    router.push("/customer/browse");
                  }}
                  className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      {!loading && !error && products.length > 0 && pagination.pages > 1 && (
        <section className="border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-16">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="h-11 px-8 border border-gray-200 dark:border-gray-800 text-[10px] text-gray-900 dark:text-white hover:border-black dark:hover:border-white transition-colors uppercase tracking-[0.2em] font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>

              <div className="flex items-center gap-1 mx-4">
                {Array.from(
                  { length: Math.min(5, pagination.pages) },
                  (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: pageNum }))
                        }
                        className={`h-11 w-11 text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                          pagination.page === pageNum
                            ? "bg-black dark:bg-white text-white dark:text-black"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
                {pagination.pages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: pagination.pages,
                        }))
                      }
                      className="h-11 w-11 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {pagination.pages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(pagination.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="h-11 px-8 border border-gray-200 dark:border-gray-800 text-[10px] text-gray-900 dark:text-white hover:border-black dark:hover:border-white transition-colors uppercase tracking-[0.2em] font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
