"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  BookmarkIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

// Product Card Component (EXACT same as landing page)
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
        <a href={`/customer/products/${id}`} className="block">
          <div
            // Increased height to make card slightly taller (3/4 aspect)
            className="relative w-full aspect-[3/4]"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
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
            // slightly smaller action button for compact card
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
          <a href={`/customer/products/${id}`} className="block flex-1">
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
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
                className={`w-3 h-3 transition-colors cursor-pointer ${
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
            Rs {price.toFixed(2)}
          </span>
          {costPrice && costPrice > price && (
            <span className="text-[10px] text-gray-400 line-through">
              Rs {costPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Category Structure - TEXTILE/CLOTHING ONLY
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

// Mock Products Data
const ALL_PRODUCTS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    category: "Men",
    subcategory: "T-Shirts",
    price: 29.99,
    costPrice: 49.99,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    ],
    quantity: 50,
    inStock: true,
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    category: "Women",
    subcategory: "Jackets",
    price: 89.99,
    costPrice: 129.99,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
    quantity: 30,
    inStock: true,
  },
  {
    id: 3,
    name: "Casual Sneakers",
    category: "Men",
    subcategory: "Activewear",
    price: 79.99,
    costPrice: 119.99,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
    quantity: 45,
    inStock: true,
  },
  {
    id: 4,
    name: "Summer Dress",
    category: "Women",
    subcategory: "Dresses",
    price: 59.99,
    costPrice: 89.99,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
    ],
    quantity: 25,
    inStock: true,
  },
  {
    id: 5,
    name: "Casual Hoodie",
    category: "Unisex",
    subcategory: "Hoodies",
    price: 39.99,
    costPrice: 59.99,
    images: [
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
    ],
    quantity: 60,
    inStock: true,
  },
  {
    id: 6,
    name: "Formal Suit",
    category: "Men",
    subcategory: "Suits",
    price: 149.99,
    costPrice: 199.99,
    images: [
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500",
    ],
    quantity: 15,
    inStock: true,
  },
  {
    id: 7,
    name: "Sports Jersey",
    category: "Unisex",
    subcategory: "Activewear",
    price: 69.99,
    costPrice: 99.99,
    images: ["https://images.unsplash.com/photo-1614251056198-ff101ebaba5e?w=500"],
    quantity: 40,
    inStock: true,
  },
  {
    id: 8,
    name: "Printed Kurta",
    category: "Women",
    subcategory: "Kurta",
    price: 129.99,
    costPrice: 179.99,
    images: [
      "https://images.unsplash.com/photo-1583391733956-6c78276477e5?w=500",
    ],
    quantity: 20,
    inStock: true,
  },
  {
    id: 9,
    name: "Winter Coat",
    category: "Men",
    subcategory: "Coats",
    price: 189.99,
    costPrice: 229.99,
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400",
    ],
    quantity: 35,
    inStock: true,
  },
  {
    id: 10,
    name: "Wool Sweater",
    category: "Women",
    subcategory: "Sweaters",
    price: 79.99,
    costPrice: 99.99,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
    ],
    quantity: 50,
    inStock: true,
  },
  {
    id: 11,
    name: "Formal Trousers",
    category: "Men",
    subcategory: "Trousers",
    price: 139.99,
    costPrice: 179.99,
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400",
    ],
    quantity: 28,
    inStock: true,
  },
  {
    id: 12,
    name: "Embroidered Shalwar Kameez",
    category: "Women",
    subcategory: "Shalwar Kameez",
    price: 119.99,
    costPrice: 149.99,
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400",
    ],
    quantity: 100,
    inStock: true,
  },
  {
    id: 13,
    name: "Kids Jacket",
    category: "Kids",
    subcategory: "Jackets",
    price: 45.99,
    costPrice: 65.99,
    images: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400",
    ],
    quantity: 55,
    inStock: true,
  },
  {
    id: 14,
    name: "Kids T-Shirt",
    category: "Kids",
    subcategory: "T-Shirts",
    price: 24.99,
    costPrice: 34.99,
    images: [
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400",
    ],
    quantity: 42,
    inStock: true,
  },
  {
    id: 15,
    name: "Lawn Suit",
    category: "Women",
    subcategory: "Lawn Suits",
    price: 84.99,
    costPrice: 109.99,
    images: [
      "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400",
    ],
    quantity: 70,
    inStock: true,
  },
  {
    id: 16,
    name: "Sleepwear Set",
    category: "Unisex",
    subcategory: "Sleepwear",
    price: 49.99,
    costPrice: 69.99,
    images: ["https://images.unsplash.com/photo-1584032186561-de987f7bd4b0?w=400"],
    quantity: 33,
    inStock: true,
  },
];

const SORT_OPTIONS = [
  { label: "Latest", value: "latest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
];

export default function BrowsePage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState("latest");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);

  useEffect(() => {
    const categoryFromUrl = searchParams?.get("category");
    const subcategoryFromUrl = searchParams?.get("subcategory");

    if (categoryFromUrl) {
      // Capitalize first letter to match state format
      const formattedCategory =
        categoryFromUrl.charAt(0).toUpperCase() + categoryFromUrl.slice(1);
      setSelectedCategory(formattedCategory);
    }

    if (subcategoryFromUrl) {
      // Capitalize first letter and handle hyphens
      const formattedSubcategory = subcategoryFromUrl
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-");
      setSelectedSubcategory(formattedSubcategory);
    }
  }, [searchParams]);

  const toggleWishlist = (productId: number | string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    toast.success(
      wishlist.includes(productId)
        ? "Removed from wishlist"
        : "Added to wishlist"
    );
  };

  const handleAddToCart = (productId: number | string) => {
    toast.success("Added to cart");
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

  // Filter and sort products
  const filteredProducts = ALL_PRODUCTS.filter((product) => {
    const categoryMatch =
      selectedCategory === "All" || product.category === selectedCategory;
    const subcategoryMatch =
      !selectedSubcategory || product.subcategory === selectedSubcategory;
    return categoryMatch && subcategoryMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "name-asc":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
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
              {filteredProducts.length} items
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
                    if (category === "All") {
                      router.push("/customer/browse");
                    } else {
                      router.push(
                        `/customer/browse?category=${category.toLowerCase()}`
                      );
                    }
                  }}
                  className={`px-5 h-10 text-[10px] uppercase tracking-[0.2em] font-medium whitespace-nowrap transition-all duration-300 ${
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
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    {selectedSubcategory || "Category"}
                  </button>

                  {subcategoryOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setSubcategoryOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 z-50 max-h-[400px] overflow-y-auto">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setSelectedSubcategory(null);
                              setSubcategoryOpen(false);
                              router.push(
                                `/customer/browse?category=${selectedCategory.toLowerCase()}`
                              );
                            }}
                            className={`block w-full text-left px-4 py-3 text-xs transition-colors ${
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
                                router.push(
                                  `/customer/browse?category=${selectedCategory.toLowerCase()}&subcategory=${sub.toLowerCase()}`
                                );
                              }}
                              className={`block w-full text-left px-4 py-3 text-xs transition-colors ${
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
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Sort
                </button>

                {filtersOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
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
                            }}
                            className={`block w-full text-left px-4 py-3 text-xs transition-colors ${
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

      {/* Products Grid - EXACT SAME AS LANDING PAGE */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {filteredProducts.length > 0 ? (
            // Use 5 columns at large screens, uniform gap-8 for spacing
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  costPrice={product.costPrice}
                  images={product.images}
                  category={product.category}
                  quantity={product.quantity}
                  inStock={product.inStock}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isInWishlist={wishlist.includes(product.id)}
                  showActions={true}
                />
              ))}
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
                    setSortBy("latest");
                    router.push("/customer/browse");
                  }}
                  className="text-xs uppercase tracking-[0.2em] text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <section className="border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-16">
            <div className="flex items-center justify-center gap-2">
              <button className="h-11 px-8 border border-gray-200 dark:border-gray-800 text-[10px] text-gray-900 dark:text-white hover:border-black dark:hover:border-white transition-colors uppercase tracking-[0.2em] font-medium">
                Previous
              </button>

              <div className="flex items-center gap-1 mx-4">
                <button className="h-11 w-11 bg-black dark:bg-white text-white dark:text-black text-xs font-medium flex items-center justify-center">
                  1
                </button>
                <button className="h-11 w-11 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium flex items-center justify-center transition-colors">
                  2
                </button>
                <button className="h-11 w-11 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium flex items-center justify-center transition-colors">
                  3
                </button>
                <span className="px-2 text-gray-400">...</span>
                <button className="h-11 w-11 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-xs font-medium flex items-center justify-center transition-colors">
                  12
                </button>
              </div>

              <button className="h-11 px-8 border border-gray-200 dark:border-gray-800 text-[10px] text-gray-900 dark:text-white hover:border-black dark:hover:border-white transition-colors uppercase tracking-[0.2em] font-medium">
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
