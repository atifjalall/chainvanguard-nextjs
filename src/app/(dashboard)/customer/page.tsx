"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/_ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartIconSolid } from "@heroicons/react/24/solid";
import { toast } from "sonner";

// Mock data for featured products
const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: "Premium Cotton T-Shirt",
    category: "Men",
    price: 29.99,
    originalPrice: 49.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
    badge: "Best Seller",
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 2,
    name: "Classic Denim Jacket",
    category: "Women",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    badge: "Trending",
    rating: 4.9,
    reviews: 187,
  },
  {
    id: 3,
    name: "Sneakers Collection",
    category: "Unisex",
    price: 79.99,
    originalPrice: 119.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
    badge: "New",
    rating: 4.7,
    reviews: 156,
  },
  {
    id: 4,
    name: "Summer Dress",
    category: "Women",
    price: 59.99,
    originalPrice: 89.99,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
    badge: "Sale",
    rating: 4.6,
    reviews: 203,
  },
  {
    id: 5,
    name: "Leather Wallet",
    category: "Accessories",
    price: 39.99,
    originalPrice: 59.99,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
    badge: "Hot",
    rating: 4.7,
    reviews: 142,
  },
  {
    id: 6,
    name: "Sport Watch",
    category: "Accessories",
    price: 149.99,
    originalPrice: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    badge: "Premium",
    rating: 4.9,
    reviews: 289,
  },
  {
    id: 7,
    name: "Casual Backpack",
    category: "Unisex",
    price: 69.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
    badge: "Popular",
    rating: 4.5,
    reviews: 198,
  },
  {
    id: 8,
    name: "Designer Sunglasses",
    category: "Accessories",
    price: 129.99,
    originalPrice: 179.99,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500",
    badge: "Luxury",
    rating: 4.8,
    reviews: 167,
  },
];

const NEW_ARRIVALS = [
  {
    id: 9,
    name: "Winter Coat",
    price: 189.99,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400",
  },
  {
    id: 10,
    name: "Wool Sweater",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",
  },
  {
    id: 11,
    name: "Chelsea Boots",
    price: 139.99,
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400",
  },
  {
    id: 12,
    name: "Knit Beanie",
    price: 19.99,
    image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400",
  },
];

const CATEGORIES = [
  { name: "Men", count: "2,456" },
  { name: "Women", count: "3,821" },
  { name: "Kids", count: "1,203" },
  { name: "Accessories", count: "945" },
];

const COLLECTIONS = [
  {
    title: "Summer Collection",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800",
  },
  {
    title: "Winter Essentials",
    image: "https://images.unsplash.com/photo-1483118714900-540cf339fd46?w=800",
  },
];

export default function CustomerDashboard() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubscribe = () => {
    // Simple email validation
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (isValid) {
      toast.success("Subscribed");
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 2000); // Reset after 2s
    }
    // Optionally, show error toast if invalid:
    // else toast.error("Please enter a valid email address");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600"
            alt="Hero"
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 dark:to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl space-y-8">
            <div className="space-y-4 animate-fadeIn">
              <p className="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">
                New Season
              </p>
              <h1 className="text-6xl sm:text-7xl font-light text-gray-900 dark:text-white">
                Timeless
                <span className="block font-normal">Elegance</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
                Curated collections of premium quality products for the
                discerning shopper.
              </p>
            </div>

            <div
              className="flex gap-4 animate-fadeIn"
              style={{ animationDelay: "0.2s" }}
            >
              <Button
                size="lg"
                onClick={() => router.push("/customer/products")}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-8 h-9 rounded-none text-xs cursor-pointer"
              >
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push("/customer/products")}
                className="border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 px-8 h-9 rounded-none text-xs cursor-pointer"
              >
                Explore
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: TruckIcon,
                title: "Free Shipping",
                desc: "On orders over $50",
              },
              {
                icon: ShieldCheckIcon,
                title: "Secure Payment",
                desc: "100% protected",
              },
              {
                icon: ShoppingBagIcon,
                title: "Easy Returns",
                desc: "30-day guarantee",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center space-y-2">
                <feature.icon className="h-6 w-6 mx-auto text-gray-900 dark:text-white" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {CATEGORIES.map((category, index) => (
              <button
                key={index}
                onClick={() =>
                  router.push(`/customer/products?category=${category.name}`)
                }
                className="group text-center space-y-3 p-8 border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 cursor-pointer"
              >
                <h3 className="text-xl font-light text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {category.count} items
                </p>
                <div className="flex items-center justify-center text-sm text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore <ArrowRightIcon className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {COLLECTIONS.map((collection, index) => (
              <div
                key={index}
                className="group relative h-96 overflow-hidden cursor-pointer"
                onClick={() => router.push("/customer/products")}
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all duration-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-light text-white">
                    {collection.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center space-y-2">
            <h2 className="text-4xl font-light text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Handpicked for quality and style
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURED_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/customer/products/${product.id}`)}
              >
                <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100 dark:bg-gray-900">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    {wishlist.includes(product.id) ? (
                      <HeartIconSolid className="h-5 w-5 text-gray-900 dark:text-white" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-900 dark:text-white" />
                    )}
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-white">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                      ${product.originalPrice}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button
              variant="outline"
              onClick={() => router.push("/customer/products")}
              className="border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 px-8 h-9 rounded-none text-xs cursor-pointer"
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 space-y-2">
            <p className="text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Just In
            </p>
            <h2 className="text-4xl font-light text-gray-900 dark:text-white">
              New Arrivals
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {NEW_ARRIVALS.map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/customer/products/${item.id}`)}
              >
                <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-100 dark:bg-gray-900">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 left-4 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-none">
                    New
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-900 dark:text-white">
                    ${item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white">
              Stay Updated
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Subscribe to receive updates on new arrivals and exclusive offers.
            </p>
          </div>

          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-9 px-4 bg-transparent border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors cursor-text rounded-none text-xs"
              disabled={subscribed}
            />
            <Button
              className="h-9 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-8 cursor-pointer rounded-none text-xs"
              onClick={handleSubscribe}
              type="button"
              disabled={subscribed}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </Button>
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center space-y-2">
            <h2 className="text-3xl font-light text-gray-900 dark:text-white">
              @shopwithus
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Follow us on Instagram
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="aspect-square overflow-hidden cursor-pointer group"
              >
                <img
                  src={`https://images.unsplash.com/photo-${1483985988355 + index * 10000}-763728e1935b?w=400`}
                  alt={`Instagram ${index + 1}`}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
