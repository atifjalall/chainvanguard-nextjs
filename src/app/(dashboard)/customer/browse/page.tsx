/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Star,
  ShoppingCart,
  Heart,
  Package,
  SlidersHorizontal,
  Grid3X3,
  List,
  Eye,
  Sparkles,
  Filter,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

const mockProducts = [
  {
    id: "1",
    name: "Premium Cotton T-Shirt",
    description: "Ultra-soft premium quality cotton t-shirt with perfect fit",
    price: 29.99,
    category: "Textiles",
    vendor: "Fashion Hub",
    rating: 4.5,
    reviews: 128,
    inStock: 100,
    addedDate: "2025-08-15",
    tags: ["premium", "cotton", "comfortable"],
  },
  {
    id: "2",
    name: "Organic Coffee Beans",
    description: "Single-origin organic coffee beans from Ethiopian highlands",
    price: 24.99,
    category: "Food & Beverages",
    vendor: "Green Farm Co.",
    rating: 4.8,
    reviews: 89,
    inStock: 45,
    addedDate: "2025-08-14",
    tags: ["organic", "ethiopian", "single-origin"],
  },
  {
    id: "3",
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    category: "Electronics",
    vendor: "Tech Solutions Inc.",
    rating: 4.6,
    reviews: 234,
    inStock: 25,
    addedDate: "2025-08-13",
    tags: ["wireless", "bluetooth", "noise-cancelling"],
  },
  {
    id: "4",
    name: "Handcrafted Ceramic Mug",
    description: "Beautiful handcrafted ceramic mug perfect for your morning coffee",
    price: 18.99,
    category: "Home & Kitchen",
    vendor: "Artisan Crafts",
    rating: 4.3,
    reviews: 67,
    inStock: 78,
    addedDate: "2025-08-12",
    tags: ["handcrafted", "ceramic", "kitchen"],
  },
  {
    id: "5",
    name: "Yoga Exercise Mat",
    description: "Non-slip eco-friendly yoga mat for all your fitness needs",
    price: 49.99,
    category: "Sports & Fitness",
    vendor: "FitLife Store",
    rating: 4.7,
    reviews: 156,
    inStock: 33,
    addedDate: "2025-08-11",
    tags: ["yoga", "fitness", "eco-friendly"],
  },
  {
    id: "6",
    name: "Smart Home LED Bulb",
    description: "WiFi-enabled smart LED bulb with color changing capabilities",
    price: 34.99,
    category: "Electronics",
    vendor: "Smart Home Solutions",
    rating: 4.4,
    reviews: 98,
    inStock: 120,
    addedDate: "2025-08-10",
    tags: ["smart", "led", "wifi"],
  },
  {
    id: "7",
    name: "Vintage Leather Wallet",
    description: "Genuine leather wallet with RFID protection and classic design",
    price: 79.99,
    category: "Fashion & Accessories",
    vendor: "Leather Craft Co.",
    rating: 4.9,
    reviews: 203,
    inStock: 42,
    addedDate: "2025-08-09",
    tags: ["leather", "vintage", "rfid"],
  },
  {
    id: "8",
    name: "Plant-Based Protein Powder",
    description: "Organic plant-based protein powder with vanilla flavor",
    price: 39.99,
    category: "Food & Beverages",
    vendor: "Nutrition Plus",
    rating: 4.2,
    reviews: 87,
    inStock: 67,
    addedDate: "2025-08-08",
    tags: ["protein", "plant-based", "vanilla"],
  },
];

const categories = [
  "All Categories",
  "Textiles",
  "Food & Beverages",
  "Electronics",
  "Home & Kitchen",
  "Sports & Fitness",
  "Fashion & Accessories",
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "newest", label: "Newest First" },
];

export default function BrowseProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState("name-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.vendor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating-desc":
          return b.rating - a.rating;
        case "newest":
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, sortBy]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    toast.success(favorites.includes(productId) ? "Removed from favorites" : "Added to favorites");
  };

  const addToCart = (product: any) => {
    toast.success(`Added ${product.name} to cart`);
  };

  const ProductCard = ({ product }: { product: any }) => (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
      
      <CardHeader className="relative z-10 p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-400 dark:text-gray-500" />
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <Badge
              className="text-xs px-2 py-1 bg-green-500 text-white shadow-lg"
              variant="secondary"
            >
              {product.inStock} left
            </Badge>
            {product.rating >= 4.5 && (
              <Badge
                className="text-xs px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg"
                variant="secondary"
              >
                <Star className="h-3 w-3 mr-1" />
                Top Rated
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/20 backdrop-blur-sm">
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 p-0 rounded-full bg-white/90 hover:bg-white shadow-lg"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className={`h-10 w-10 p-0 rounded-full shadow-lg ${
                favorites.includes(product.id)
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-white/90 hover:bg-white"
              }`}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-400">
              {product.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {product.rating}
              </span>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {product.description}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              by {product.vendor}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${product.price}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {product.reviews} reviews
              </p>
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
              onClick={() => addToCart(product)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }: { product: any }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
      
      <CardContent className="relative z-10 p-4">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-400">
                    {product.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {product.description}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  by {product.vendor}
                </p>
              </div>
              
              <div className="text-right ml-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${product.price}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                {product.inStock} in stock
              </Badge>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    favorites.includes(product.id) ? "text-red-500" : ""
                  }`}
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? "fill-current" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  onClick={() => addToCart(product)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Browse Products
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover verified products on our blockchain platform
                </p>
              </div>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                {filteredAndSortedProducts.length} Products
              </Badge>
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white/50 dark:bg-gray-800/50">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
            
            <CardHeader className="relative z-10 pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <SlidersHorizontal className="h-3 w-3 text-white" />
                </div>
                Filters & Search
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative z-10 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search products, vendors, descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-blue-500"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Filters */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredAndSortedProducts.length} of {mockProducts.length} products
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      <Search className="h-3 w-3 mr-1" />
                      {searchTerm}
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedCategory !== "All Categories" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                      <Filter className="h-3 w-3 mr-1" />
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("All Categories")}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedProducts.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {filteredAndSortedProducts.map((product) =>
                viewMode === "grid" ? (
                  <ProductCard key={product.id} product={product} />
                ) : (
                  <ProductListItem key={product.id} product={product} />
                )
              )}
            </div>
          ) : (
            <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  We could not find any products matching your criteria. Try adjusting your search terms or filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All Categories");
                  }}
                  className="border-gray-200 dark:border-gray-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}