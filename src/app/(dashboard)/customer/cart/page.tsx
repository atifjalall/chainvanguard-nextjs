"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Badge } from "@/components/_ui/badge";
import { Separator } from "@/components/_ui/separator";
import Link from "next/link";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  Package,
  CreditCard,
  Truck,
  Shield,
  Tag,
  Heart,
} from "lucide-react";
import { toast } from "sonner";

const mockCartItems = [
  {
    id: "1",
    name: "Premium Cotton T-Shirt",
    description: "Ultra-soft premium quality cotton t-shirt",
    price: 29.99,
    quantity: 2,
    vendor: "Fashion Hub",
    category: "Textiles",
    inStock: 100,
  },
  {
    id: "2",
    name: "Organic Coffee Beans",
    description: "Single-origin organic coffee from Ethiopian highlands",
    price: 24.99,
    quantity: 1,
    vendor: "Green Farm Co.",
    category: "Food & Beverages",
    inStock: 45,
  },
  {
    id: "3",
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    quantity: 1,
    vendor: "Tech Solutions Inc.",
    category: "Electronics",
    inStock: 25,
  },
];

export default function ShoppingCartPage() {
  const [cartItems, setCartItems] = useState(mockCartItems);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const discount = appliedPromo === "SAVE10" ? subtotal * 0.1 : 0;
  const total = subtotal + shipping - discount;

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    toast.success("Quantity updated");
  };

  const removeItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success("Item removed from cart");
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "SAVE10") {
      setAppliedPromo("SAVE10");
      setPromoCode("");
      toast.success("Promo code applied! 10% discount added.");
    } else {
      toast.error("Invalid promo code. Try: SAVE10");
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    toast.success("Promo code removed");
  };

  if (cartItems.length === 0) {
    return (
      <div className="space-y-8 p-6">
        {/* Back Button */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Link href="/customer/browse">
            <Button
              variant="ghost"
              className="text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Empty Cart */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent>
              <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Your cart is empty
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Add some products to your cart to get started with blockchain
                checkout
              </p>
              <Link href="/customer/browse">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-6 mb-2">
          <Link href="/customer/browse">
            <Button
              variant="ghost"
              className="text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Shopping Cart
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {cartItems.length} items ready for blockchain checkout
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item, index) => (
              <Card
                key={item.id}
                className={`border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl transform transition-all duration-500 delay-${(index + 1) * 100}`}
              >
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge
                            variant="outline"
                            className="text-xs mb-2 border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                          >
                            {item.category}
                          </Badge>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {item.description}
                          </p>
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            by {item.vendor}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            ${item.price}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${(item.price * item.quantity).toFixed(2)} total
                          </p>
                        </div>
                      </div>

                      {/* Quantity Controls & Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Quantity Control */}
                          <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= item.inStock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          >
                            {item.inStock} available
                          </Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-gray-500 hover:text-red-600"
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 p-0 text-gray-500 hover:text-red-600"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal (
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    items)
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-base">
                  <span className="text-gray-600 dark:text-gray-400">
                    Shipping
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Free Shipping Notice */}
                {shipping > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    Add ${(100 - subtotal).toFixed(2)} more for free shipping
                  </div>
                )}

                {/* Discount */}
                {appliedPromo && (
                  <div className="flex justify-between text-base">
                    <span className="text-gray-600 dark:text-gray-400">
                      Discount ({appliedPromo})
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-2 text-red-500 hover:text-red-700"
                        onClick={removePromoCode}
                      >
                        ×
                      </Button>
                    </span>
                    <span className="font-medium text-green-600">
                      -${discount.toFixed(2)}
                    </span>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Total */}
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900 dark:text-gray-100">
                    Total
                  </span>
                  <span className="text-gray-900 dark:text-gray-100">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-medium mt-6">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                {/* Security Notice */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-3">
                  <Shield className="h-4 w-4" />
                  Secure blockchain transaction
                </div>
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!appliedPromo ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="h-11 bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                      />
                      <Button
                        variant="outline"
                        className="h-11 px-6 border-gray-200 dark:border-gray-700"
                        onClick={applyPromoCode}
                        disabled={!promoCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Try: SAVE10 for 10% off
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Code &quot;{appliedPromo}&quot; applied!
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-green-600 hover:text-red-600"
                      onClick={removePromoCode}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Fast Delivery
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      2-3 business days
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
