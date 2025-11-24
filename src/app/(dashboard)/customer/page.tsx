"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CubeIcon,
  BookmarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { productAPI } from "@/lib/api/product.api";
import type { Product } from "@/types";

const COLLECTIONS = [
  {
    title: "Summer Collection",
    image: "/summer.jpg",
    season: "Summer",
  },
  {
    title: "Winter Essentials",
    image: "/winter.jpg",
    season: "Winter",
  },
];

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  costPrice?: number;
  images: string[];
  color?: string;
  quantity?: number;
  inStock?: boolean;
  onAddToCart?: (id: string | number) => void;
  onToggleWishlist?: (id: string | number) => void;
  isInWishlist?: boolean;
  showActions?: boolean;
  href?: string;
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
      <div className="relative bg-gray-100 w-full overflow-hidden">
        <a href={href || `/customer/product/${id}`} className="block">
          <div
            className="relative w-full aspect-[3/4]" // changed from aspect-[4/5] to match browse page
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
            className="absolute bottom-1.5 left-1.5 w-4 h-4 bg-white dark:bg-gray-950 flex items-center justify-center cursor-pointer z-10" // added dark:bg to match browse
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

      {/* Content Below Image */}
      <div className="pt-1 pb-2">
        {/* Product Name */}
        <div className="flex items-center justify-between mb-0">
          <a href={href || `/customer/product/${id}`} className="block flex-1">
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
                    ? "fill-black text-black"
                    : "text-gray-400 hover:text-black"
                }`}
              />
            </button>
          )}
        </div>

        {/* Price */}
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

export default function CustomerDashboard() {
  usePageTitle("Customer");
  const router = useRouter();
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Real data state
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categoryStats, setCategoryStats] = useState({
    Men: 0,
    Women: 0,
    Kids: 0,
    Unisex: 0,
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  const carouselImages = ["/crousal/image5.png"];

  // Fetch real data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch featured products, new arrivals, and total count in parallel
        const [featuredRes, newArrivalsRes, allProductsRes] = await Promise.all(
          [
            productAPI.getFeaturedProducts(10),
            productAPI.getNewArrivals(5),
            productAPI.getProducts({ page: 1, limit: 100 }), // Fetch first 100 to count categories
          ]
        );

        if (featuredRes.success && featuredRes.products) {
          setFeaturedProducts(featuredRes.products);
        }

        if (newArrivalsRes.success && newArrivalsRes.products) {
          setNewArrivals(newArrivalsRes.products);
        }

        if (allProductsRes.success && allProductsRes.pagination) {
          setTotalProducts(allProductsRes.pagination.total);

          // Count products by category (Men, Women, Kids, Unisex)
          const stats = {
            Men: 0,
            Women: 0,
            Kids: 0,
            Unisex: 0,
          };

          // Backend returns 'data' field, not 'products'
          const productsData = allProductsRes as {
            data?: Product[];
            products?: Product[];
            pagination: { total: number };
          };
          const products = productsData.data || productsData.products || [];

          if (products && Array.isArray(products)) {
            products.forEach((product: Product) => {
              const cat = product.category;
              if (
                cat === "Men" ||
                cat === "Women" ||
                cat === "Kids" ||
                cat === "Unisex"
              ) {
                stats[cat] = stats[cat] + 1;
              }
            });

            setCategoryStats(stats);
          } else {
            console.warn("No products found in response");
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load some data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

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

  const handleSubscribe = () => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (isValid) {
      toast.success("Subscribed");
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section - Premium Full Bleed */}
      <section className="relative min-h-[90vh] flex items-start pt-38 overflow-hidden bg-white dark:bg-gray-950">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600"
            alt="Hero"
            className="w-full h-full object-cover opacity-[0.08] dark:opacity-[0.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80 dark:from-gray-950 dark:via-gray-950/95 dark:to-gray-950/80" />
        </div>

        <div className="relative z-10 w-full">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
              {/* Left: Text Content */}
              <div className="space-y-8">
                <div className="space-y-6 opacity-0 animate-slideUp">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 font-light">
                      New Season {new Date().getFullYear()}
                    </p>
                  </div>
                  <h1 className="text-7xl lg:text-8xl font-extralight text-gray-900 dark:text-white leading-[0.95] tracking-tight">
                    Timeless
                    <span className="block font-light mt-2">Elegance</span>
                  </h1>
                  <p className="text-base text-gray-600 dark:text-gray-400 max-w-md font-light leading-relaxed">
                    Discover our meticulously curated collection of premium
                    quality products, designed for those who appreciate refined
                    craftsmanship.
                  </p>
                </div>
                <div
                  className="flex gap-4 opacity-0 animate-slideUp"
                  style={{ animationDelay: "0.3s" }}
                >
                  <button
                    onClick={() => router.push("/customer/browse")}
                    className="bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black px-10 h-11 rounded-none uppercase tracking-[0.2em] text-[10px] font-medium cursor-pointer transition-all duration-300"
                  >
                    Discover Collection
                  </button>
                  <button
                    onClick={() => router.push("/customer/browse")}
                    className="border border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-10 h-11 rounded-none uppercase tracking-[0.2em] text-[10px] font-medium cursor-pointer transition-all duration-300"
                  >
                    Explore More
                  </button>
                </div>
              </div>

              {/* Right: Carousel */}
              <div
                className="opacity-0 animate-slideUp hidden lg:block"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="relative w-[900px] h-[900px] overflow-hidden -mt-50 -mr-30">
                  {" "}
                  {carouselImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        index === currentSlide ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`Slide ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0 animate-fadeIn"
          style={{ animationDelay: "0.6s" }}
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600">
            Scroll
          </p>
          <div className="w-px h-16 bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700 dark:to-transparent" />
        </div>
      </section>

      {/* Features - Elegant Strip */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {" "}
          {/* replaced */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-800">
            {[
              {
                icon: TruckIcon,
                title: "Complimentary Shipping",
                desc: "On all orders over CVT 3000",
              },
              {
                icon: ShieldCheckIcon,
                title: "Secure Transaction",
                desc: "Protected payment gateway",
              },
              {
                icon: ShoppingBagIcon,
                title: "Hassle-Free Returns",
                desc: "30-day return policy",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="py-12 lg:py-16 text-center space-y-5 px-8 group cursor-default"
              >
                <feature.icon
                  className="h-7 w-7 mx-auto text-gray-900 dark:text-white opacity-70 group-hover:opacity-100 transition-opacity duration-300"
                  strokeWidth={1.2}
                />
                <div className="space-y-2">
                  <h3 className="text-sm font-normal text-gray-900 dark:text-white tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-light">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories - Modern Grid */}
      <section className="py-32 pb-6">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {" "}
          {/* replaced */}
          <div className="mb-20 text-center space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
              Shop by
            </p>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Categories
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? // Loading skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-800"
                  />
                ))
              : ["Men", "Women", "Kids", "Unisex"].map((categoryName) => (
                  <button
                    key={categoryName}
                    onClick={() =>
                      router.push(`/customer/browse?category=${categoryName}`)
                    }
                    className="group relative aspect-[4/3] bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white"
                  >
                    <div className="h-full flex flex-col items-center justify-center px-6 text-center space-y-3">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wider uppercase">
                        {categoryName}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-wider">
                        {
                          categoryStats[
                            categoryName as keyof typeof categoryStats
                          ]
                        }{" "}
                        Items
                      </p>
                      <div className="flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-1">
                        <span className="tracking-wider text-[10px] uppercase">
                          Explore
                        </span>
                        <ArrowRightIcon
                          className="h-3 w-3 ml-1 transform group-hover:translate-x-1 transition-transform"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </div>
      </section>

      {/* Collections - Editorial Style */}
      <section className="py-6">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {" "}
          {/* replaced */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {COLLECTIONS.map((collection, index) => (
              <div
                key={index}
                className="group relative h-[40vh] overflow-hidden cursor-pointer bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all duration-300"
                onClick={() =>
                  router.push(`/customer/browse?season=${collection.season}`)
                }
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-1000 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/30 to-transparent dark:from-black/90 dark:via-black/70 dark:to-transparent" />
                <div className="absolute inset-0 flex items-center px-12">
                  <div className="space-y-4 transform group-hover:translate-x-2 transition-transform duration-500">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-8 bg-gray-900 dark:bg-white group-hover:w-12 transition-all duration-500" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-light text-gray-900 dark:text-white tracking-tight">
                      {collection.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-medium">
                        View Collection
                      </span>
                      <ArrowRightIcon
                        className="h-3 w-3 transform group-hover:translate-x-1 transition-transform duration-500"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-6 pt-32">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {" "}
          {/* replaced */}
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Curated Selection
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Featured Products
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-2xl">
              Handpicked pieces that embody quality, style, and timeless design
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
            {" "}
            {/* changed grid to match browse: 5 on lg, gap-10 */}
            {loading ? (
              // Loading skeletons
              Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-1/2" />
                </div>
              ))
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  costPrice={product.costPrice}
                  images={product.images?.map((img) => img.url) || []}
                  quantity={product.quantity}
                  inStock={product.quantity > 0}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isInWishlist={wishlist.includes(product._id)}
                  showActions={true}
                />
              ))
            ) : (
              <div className="col-span-5 text-center py-16 text-gray-500">
                No featured products available
              </div>
            )}
          </div>
          <div className="mt-24 text-center">
            <button
              onClick={() => router.push("/customer/browse")}
              className="border border-black dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-12 h-11 rounded-none uppercase tracking-[0.2em] text-[10px] font-medium cursor-pointer transition-all duration-300"
            >
              View All Products
            </button>
          </div>
        </div>
      </section>

      {/* New Arrivals - Dark Section */}
      <section className="py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {" "}
          {/* replaced */}
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Latest Additions
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              New Arrivals
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
            {" "}
            {/* changed to match browse: 5 columns on lg and gap-10 */}
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-[3/4] bg-gray-300 dark:bg-gray-700 animate-pulse" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-3 bg-gray-300 dark:bg-gray-700 animate-pulse rounded w-1/2" />
                </div>
              ))
            ) : newArrivals.length > 0 ? (
              newArrivals.map((item) => (
                <ProductCard
                  key={item._id}
                  id={item._id}
                  name={item.name}
                  price={item.price}
                  costPrice={item.costPrice}
                  images={item.images?.map((img) => img.url) || []}
                  quantity={item.quantity}
                  inStock={item.quantity > 0}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={toggleWishlist}
                  isInWishlist={wishlist.includes(item._id)}
                  showActions={true}
                />
              ))
            ) : (
              <div className="col-span-5 text-center py-16 text-gray-500 dark:text-gray-400">
                No new arrivals available
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter - Minimal */}
      <section className="py-32 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-12 text-center space-y-12">
          {" "}
          {/* reduced px to match browse */}
          <div className="space-y-4">
            <h2 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Join Our Community
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed max-w-lg mx-auto">
              Be the first to discover new arrivals, exclusive collections, and
              special offers crafted just for you
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="flex items-center gap-0 border-b border-gray-900 dark:border-white pb-px">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none cursor-text"
                disabled={subscribed}
              />
              <button
                className="h-12 px-6 uppercase tracking-[0.2em] text-[10px] font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-all duration-300 disabled:opacity-50"
                onClick={handleSubscribe}
                type="button"
                disabled={subscribed}
              >
                {subscribed ? "✓ Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
