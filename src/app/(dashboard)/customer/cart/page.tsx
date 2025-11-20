"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ChevronRightIcon,
  BookmarkIcon,
  TrashIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock Cart Data
const INITIAL_CART_ITEMS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    category: "Men",
    price: 29.99,
    size: "M",
    color: "Black",
    quantity: 2,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    inStock: true,
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    category: "Women",
    price: 89.99,
    size: "L",
    color: "Blue",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    inStock: true,
  },
  {
    id: 3,
    name: "Casual Sneakers",
    category: "Unisex",
    price: 79.99,
    size: "42",
    color: "White",
    quantity: 1,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    inStock: true,
  },
];

// Product Card Component (EXACT same as browse page)
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

// Recommended Products
const RECOMMENDED_PRODUCTS = [
  {
    id: 4,
    name: "Summer Dress",
    price: 59.99,
    costPrice: 89.99,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
    ],
    quantity: 1,
    inStock: true,
  },
  {
    id: 5,
    name: "Leather Wallet",
    price: 39.99,
    costPrice: 59.99,
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    ],
    quantity: 1,
    inStock: true,
  },
  {
    id: 6,
    name: "Sport Watch",
    price: 149.99,
    costPrice: 199.99,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    ],
    quantity: 1,
    inStock: true,
  },
  {
    id: 7,
    name: "Casual Backpack",
    price: 69.99,
    costPrice: 99.99,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"],
    quantity: 1,
    inStock: true,
  },
  {
    id: 8,
    name: "Designer Sunglasses",
    price: 129.99,
    costPrice: 179.99,
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    ],
    quantity: 1,
    inStock: true,
  },
];

interface CartItemProps {
  item: {
    id: number;
    name: string;
    category: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
    image: string;
    inStock: boolean;
  };
  onUpdateQuantity: (id: number, newQuantity: number) => void;
  onRemove: (id: number) => void;
  onMoveToWishlist: (id: number) => void;
}

function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist,
}: CartItemProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] gap-6 py-8 border-b border-gray-200 dark:border-gray-800">
      {/* Product Image */}
      <div
        className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden cursor-pointer"
        onClick={() => router.push(`/customer/products/${item.id}`)}
      >
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => router.push(`/customer/products/${item.id}`)}
                className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left"
              >
                {item.name}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {item.category}
              </p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-600">Color:</span>
              <span>{item.color}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-600">Size:</span>
              <span>{item.size}</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          {/* Quantity Control */}
          <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() =>
                onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
              className="w-8 h-9 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <MinusIcon className="h-3 w-3" />
            </button>
            <div className="w-12 h-9 flex items-center justify-center text-xs text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-800">
              {item.quantity}
            </div>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-8 h-9 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>

          {/* Price & Actions */}
          <div className="flex items-end gap-4">
            <button
              onClick={() => onMoveToWishlist(item.id)}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Save
            </button>
            <span className="text-sm font-light text-gray-900 dark:text-white">
              Rs {(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [promoCode, setPromoCode] = useState("");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + shipping;

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
    toast.success("Cart updated");
  };

  const handleRemove = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
    toast.success("Item removed from cart");
  };

  const handleMoveToWishlist = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
    toast.success("Moved to wishlist");
  };

  const handleApplyPromo = () => {
    if (promoCode.trim()) {
      toast.success("Promo code applied");
    }
  };

  const handleAddRecommended = (id: number) => {
    toast.success("Added to cart");
  };

  if (cartItems.length === 0) {
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
                Cart
              </span>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-32">
          <div className="max-w-md mx-auto text-center space-y-8">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <ShoppingBagIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight">
                Your Cart is Empty
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Looks like you haven&apos;t added anything to your cart yet
              </p>
            </div>
            <button
              onClick={() => router.push("/customer/browse")}
              className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
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
              Cart
            </span>
          </div>
        </div>
      </div>

      {/* Main Cart Section */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Shopping Cart
              </p>
            </div>
            <div className="flex items-center justify-between">
              <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                Your Cart
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-16">
            {/* Cart Items */}
            <div>
              {cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemove}
                  onMoveToWishlist={handleMoveToWishlist}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit space-y-8">
              <div className="p-8 space-y-6">
                <h2 className="text-lg font-light text-gray-900 dark:text-white uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-4 py-6 border-y border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Subtotal
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      Rs {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {shipping === 0 ? "Free" : `Rs ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Free shipping on orders over Rs 50
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    Rs {total.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/customer/checkout")}
                    className="w-full bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => router.push("/customer/browse")}
                    className="w-full border border-black dark:border-white text-black dark:text-white h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>

              {/* Promo Code */}
              <div className="p-8 space-y-4">
                <h3 className="text-xs font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                  Promo Code
                </h3>
                <div className="flex gap-0 border-b border-gray-900 dark:border-white pb-px">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 h-10 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="h-10 px-4 uppercase tracking-[0.2em] text-[10px] font-medium text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="py-32 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="mb-20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Complete Your Look
              </p>
            </div>
            <h2 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              You May Also Like
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
            {RECOMMENDED_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                costPrice={product.costPrice}
                images={product.images}
                quantity={product.quantity}
                inStock={product.inStock}
                onAddToCart={handleAddRecommended}
                showActions={true}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
