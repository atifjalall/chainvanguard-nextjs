/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  ShoppingBagIcon,
  ChevronRightIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  applyCoupon,
} from "@/lib/api/customer.cart.api";
import { addToWishlist, getWishlist } from "@/lib/api/customer.wishlist.api";
import { browseProducts } from "@/lib/api/customer.browse.api";
import type { Cart, CartItem as CartItemType, Product } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";
import { useCart } from "@/components/providers/cart-provider";

// Product Card Component
interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  costPrice?: number;
  images: string[];
  quantity?: number;
  inStock?: boolean;
  showActions?: boolean;
}

function ProductCard({
  id,
  name,
  price,
  costPrice,
  images,
  quantity = 0,
  inStock = true,
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
        <a href={`/customer/product/${id}`} className="block cursor-pointer">
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

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  onMoveToWishlist: (itemId: string, productId: string) => void;
  isInWishlist: boolean;
}

function CartItemComponent({
  item,
  onUpdateQuantity,
  onRemove,
  onMoveToWishlist,
  isInWishlist,
}: CartItemProps) {
  const router = useRouter();

  const product = typeof item.productId === "object" ? item.productId : null;
  const productId =
    typeof item.productId === "string" ? item.productId : item.productId?._id;
  const productName = item.productName || product?.name || "Product";
  const productImage = item.productImage || product?.images?.[0]?.url || "";
  const productCategory = product?.category || "";

  return (
    <div className="grid grid-cols-[120px_1fr] md:grid-cols-[140px_1fr] gap-6 py-8 border-b border-gray-200 dark:border-gray-800">
      <div
        className="relative bg-gray-100 dark:bg-gray-900 aspect-[3/4] overflow-hidden cursor-pointer"
        onClick={() => router.push(`/customer/product/${productId}`)}
      >
        {productImage ? (
          <img
            src={productImage}
            alt={productName}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CubeIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => router.push(`/customer/product/${productId}`)}
                className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-left cursor-pointer"
              >
                {productName}
              </button>
              {productCategory && (
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {productCategory}
                </p>
              )}
            </div>
            <button
              onClick={() => onRemove(item._id)}
              className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            {item.selectedColor && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-600">Color:</span>
                <span>{item.selectedColor}</span>
              </div>
            )}
            {item.selectedSize && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-600">Size:</span>
                <span>{item.selectedSize}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex items-center gap-0 border border-gray-200 dark:border-gray-800">
            <button
              onClick={() =>
                onUpdateQuantity(item._id, Math.max(1, item.quantity - 1))
              }
              className="w-8 h-9 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 cursor-pointer"
              disabled={item.quantity <= 1}
            >
              <MinusIcon className="h-3 w-3" />
            </button>
            <div className="w-12 h-9 flex items-center justify-center text-xs text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-800">
              {item.quantity}
            </div>
            <button
              onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
              className="w-8 h-9 flex items-center justify-center text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
            >
              <PlusIcon className="h-3 w-3" />
            </button>
          </div>

          <div className="flex items-end gap-4">
            {!isInWishlist && (
              <button
                onClick={() => onMoveToWishlist(item._id, productId)}
                className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Save
              </button>
            )}
            <span className="text-sm font-light text-gray-900 dark:text-white">
              CVT {item.subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  usePageTitle("Shopping Cart");
  const router = useRouter();
  const { refreshCartCount, incrementCartCount, decrementCartCount } =
    useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoCode, setPromoCode] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);

  useEffect(() => {
    loadCart();
    loadWishlist();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      if (response.success && response.data) {
        setCart(response.data);

        if (response.data.items && response.data.items.length > 0) {
          loadRecommendations();
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const response = await getWishlist();
      if (response.success && response.wishlist) {
        setWishlistItems(response.wishlist.items);
      }
    } catch (error) {
      console.error("Error loading wishlist:", error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await browseProducts({ isFeatured: true, limit: 5 });
      if (response.success && response.products) {
        setRecommendedProducts(response.products);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!cart) return;

    // ✅ Don't update cart count on quantity change - only on add/remove
    // Optimistic UI update
    const updatedItems = cart.items.map((item) => {
      if (item._id === itemId) {
        const newSubtotal = item.price * newQuantity;
        return { ...item, quantity: newQuantity, subtotal: newSubtotal };
      }
      return item;
    });

    const newSubtotal = updatedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    setCart({
      ...cart,
      items: updatedItems,
      subtotal: newSubtotal,
      totalAmount: newSubtotal,
      totalQuantity: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
    });

    try {
      const response = await updateCartItem(itemId, { quantity: newQuantity });
      if (response.success && response.data) {
        setCart(response.data);
        toast.success("Cart updated");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update cart");
      loadCart();
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart) return;

    const updatedItems = cart.items.filter((item) => item._id !== itemId);
    setCart({
      ...cart,
      items: updatedItems,
      totalItems: updatedItems.length,
    });

    // ✅ Decrement by 1 (removing one unique item)
    decrementCartCount(1);

    try {
      const response = await removeCartItem(itemId);
      if (response.success && response.data) {
        setCart(response.data);
        toast.success("Item removed from cart");
        // Refresh in background for accuracy
        await refreshCartCount();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
      loadCart();
    }
  };

  const handleMoveToWishlist = async (itemId: string, productId: string) => {
    if (!cart) return;

    try {
      await addToWishlist(productId);

      const updatedItems = cart.items.filter((item) => item._id !== itemId);
      setCart({
        ...cart,
        items: updatedItems,
        totalItems: updatedItems.length,
      });

      const response = await removeCartItem(itemId);
      if (response.success && response.data) {
        // ✅ Immediately refresh cart count to update badge
        await refreshCartCount();
        setCart(response.data);
      }

      // Reload wishlist to update state
      loadWishlist();

      toast.success("Moved to wishlist");
    } catch (error: any) {
      console.error("Error moving to wishlist:", error);
      if (error?.response?.data?.message?.includes("already in wishlist")) {
        const response = await removeCartItem(itemId);
        if (response.success && response.data) {
          setCart(response.data);
          // ✅ Refresh count after removal
          await refreshCartCount();
        }
        toast.success("Item already in wishlist, removed from cart");
      } else {
        toast.error("Failed to move to wishlist");
        loadCart();
      }
    }
  };

  const handleApplyPromo = async () => {
    if (promoCode.trim()) {
      try {
        const response = await applyCoupon(promoCode);
        if (response.success && response.data) {
          setCart(response.data);
          toast.success("Promo code applied");
          setPromoCode("");
        }
      } catch (error) {
        console.error("Error applying promo:", error);
        toast.error("Invalid promo code");
      }
    }
  };

  const calculateShipping = (cartData: Cart) => {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      return 0;
    }

    // Free shipping for orders over CVT 5000
    if (cartData.subtotal > 5000) {
      return 0;
    }

    const shippingByVendor: { [vendorId: string]: number[] } = {};
    let hasFreeShipping = false;

    for (const item of cartData.items) {
      const product =
        typeof item.productId === "object" ? item.productId : null;

      if (product?.freeShipping) {
        hasFreeShipping = true;
        continue;
      }

      if (product?.shippingCost) {
        const vendorId = product.sellerId?.toString() || "unknown";
        if (!shippingByVendor[vendorId]) {
          shippingByVendor[vendorId] = [];
        }
        shippingByVendor[vendorId].push(product.shippingCost);
      }
    }

    // If any product has free shipping, return 0
    if (hasFreeShipping) {
      return 0;
    }

    const vendorIds = Object.keys(shippingByVendor);

    // No shipping costs found
    if (vendorIds.length === 0) {
      return 0;
    }

    // Single vendor: use the highest shipping cost
    if (vendorIds.length === 1) {
      const costs = shippingByVendor[vendorIds[0]];
      return Math.max(...costs);
    }

    // Multiple vendors: calculate average of highest costs per vendor and round
    const highestCostPerVendor = vendorIds.map((vendorId) =>
      Math.max(...shippingByVendor[vendorId])
    );
    const averageShipping =
      highestCostPerVendor.reduce((sum, cost) => sum + cost, 0) /
      highestCostPerVendor.length;

    return Math.round(averageShipping);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading cart...
          </p>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const shipping = calculateShipping(cart!);
  const discount = cart?.discount || 0;
  const total = subtotal + shipping - discount;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                Cart
              </span>
            </div>
          </div>
        </div>

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
              className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors cursor-pointer"
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Cart
            </span>
          </div>
        </div>
      </div>

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
            <div>
              {cartItems.map((item) => {
                const productId =
                  typeof item.productId === "string"
                    ? item.productId
                    : item.productId?._id;
                const isInWishlist = wishlistItems.some(
                  (w) => w.productId._id === productId
                );
                return (
                  <CartItemComponent
                    key={item._id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemove}
                    onMoveToWishlist={handleMoveToWishlist}
                    isInWishlist={isInWishlist}
                  />
                );
              })}
            </div>

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
                      CVT {subtotal.toFixed(2)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Discount
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        -CVT {discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Shipping
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {shipping === 0 ? "Free" : `CVT ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  {shipping === 0 && subtotal <= 5000 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Free shipping applied
                    </p>
                  )}
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Free shipping on orders over CVT 5000
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-2xl font-light text-gray-900 dark:text-white">
                    CVT {total.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/customer/checkout")}
                    className="w-full bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => router.push("/customer/browse")}
                    className="w-full border border-black dark:border-white text-black dark:text-white h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {recommendedProducts.length > 0 && (
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
              {recommendedProducts.map((product, index) => (
                <ProductCard
                  key={product._id ?? `${product.name ?? "product"}-${index}`}
                  id={product._id}
                  name={product.name}
                  price={product.price}
                  costPrice={product.originalPrice}
                  images={product.images?.map((img) => img.url) || []}
                  quantity={product.quantity}
                  inStock={product.inStock}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
