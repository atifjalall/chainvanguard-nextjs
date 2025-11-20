"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CubeIcon,
  BookmarkIcon,
  PlusIcon,
  MinusIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Product Data
const PRODUCT_DATA = {
  id: 1,
  name: "Premium Cotton T-Shirt",
  category: "Men",
  subcategory: "T-Shirts",
  price: 29.99,
  costPrice: 49.99,
  description:
    "Crafted from premium organic cotton, this essential t-shirt combines comfort with timeless style. The fabric is soft, breathable, and designed to maintain its shape wash after wash.",
  details: [
    "100% Organic Cotton",
    "Pre-shrunk fabric",
    "Ribbed crew neckline",
    "Short sleeves",
    "Regular fit",
    "Machine washable",
  ],
  images: [
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
    "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800",
    "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=800",
  ],
  sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  colors: [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Grey", hex: "#9CA3AF" },
    { name: "Navy", hex: "#1E3A8A" },
  ],
  quantity: 50,
  inStock: true,
  rating: 4.8,
  reviews: 234,
  vendor: "Fashion Hub",
};

// Related Products
const RELATED_PRODUCTS = [
  {
    id: 2,
    name: "Classic Denim Jacket",
    price: 89.99,
    costPrice: 129.99,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"],
    quantity: 30,
    inStock: true,
  },
  {
    id: 3,
    name: "Casual Sneakers",
    price: 79.99,
    costPrice: 119.99,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
    quantity: 45,
    inStock: true,
  },
  {
    id: 9,
    name: "Winter Coat",
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
    price: 79.99,
    costPrice: 99.99,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
    ],
    quantity: 50,
    inStock: true,
  },
];

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
          <a href={`/customer/products/${id}`} className="block flex-1">
            <h3 className="text-xs font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {name}
            </h3>
          </a>
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

export default function ProductDetailPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlist, setWishlist] = useState<(number | string)[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  const product = PRODUCT_DATA;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor) {
      toast.error("Please select a color");
      return;
    }
    toast.success("Added to cart");
  };

  const toggleWishlist = (productId: number | string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    setIsInWishlist(!isInWishlist);
    toast.success(isInWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleRelatedAddToCart = (productId: number | string) => {
    toast.success("Added to cart");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb - At the very top */}
      <div>
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
            <button
              onClick={() =>
                router.push(`/customer/browse?category=${product.category}`)
              }
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
              {/* Main Image */}
              <div className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden">
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
                )}
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

              {/* Thumbnail Grid */}
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageLoaded(false);
                    }}
                    className={`relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden cursor-pointer transition-all ${
                      selectedImage === index
                        ? "ring-1 ring-black dark:ring-white"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              {/* Title & Price */}
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
                    Rs {product.price.toFixed(2)}
                  </span>
                  {product.costPrice && product.costPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      Rs {product.costPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {/* Vendor Store */}
                <button
                  onClick={() =>
                    router.push(
                      `/customer/vendor/${product.vendor
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`
                    )
                  }
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors underline"
                >
                  Visit {product.vendor} Store
                </button>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                    Color
                  </p>
                  {selectedColor && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedColor}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 border-2 transition-all ${
                        selectedColor === color.name
                          ? "border-black dark:border-white scale-110"
                          : "border-gray-200 dark:border-gray-800 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                    Size
                  </p>
                  {selectedSize && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedSize}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 flex items-center justify-center text-xs uppercase tracking-wider transition-all ${
                        selectedSize === size
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                  Quantity
                </p>
                <div className="flex items-center gap-0 w-32 border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-11 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </button>
                  <div className="flex-1 h-11 flex items-center justify-center text-sm text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-800">
                    {quantity}
                  </div>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-11 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="w-12 h-12 border border-black dark:border-white flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
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

              {/* Features */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                {[
                  { icon: TruckIcon, text: "Free Shipping" },
                  { icon: ShieldCheckIcon, text: "Secure Payment" },
                  { icon: ArrowPathIcon, text: "Easy Returns" },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center space-y-2"
                  >
                    <feature.icon
                      className="h-5 w-5 text-gray-900 dark:text-white opacity-70"
                      strokeWidth={1.2}
                    />
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Product Details */}
              <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                  Product Details
                </p>
                <ul className="space-y-2">
                  {product.details.map((detail, index) => (
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
              </div>
            </div>
          </div>
        </div>
      </section>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
            {RELATED_PRODUCTS.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                costPrice={item.costPrice}
                images={item.images}
                quantity={item.quantity}
                inStock={item.inStock}
                onAddToCart={handleRelatedAddToCart}
                onToggleWishlist={toggleWishlist}
                isInWishlist={wishlist.includes(item.id)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
