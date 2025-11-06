/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/magicui/highlighter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Shield,
  Zap,
  Users,
  Package,
  TrendingUp,
  CheckCircle,
  Star,
  Eye,
  BarChart3,
  Warehouse,
  ShoppingCart,
  Heart,
  Truck,
  Award,
  Sparkles,
  Gift,
  Tag,
  Flame,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Search,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import PixelBlast from "@/components/PixelBlast";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

// Enhanced motion component with 3D effects
const FocusMotionDiv = ({ children, className = "", ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={className}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      animate={{
        scale: isFocused ? 1.05 : 1,
        boxShadow: isFocused
          ? "0 0 0 4px rgba(59, 130, 246, 0.5)"
          : "0 0 0 0px rgba(59, 130, 246, 0)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Animated product card with 3D hover effect
const ProductCard = ({ product, index }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -10 }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl h-full">
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-cyan-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:via-cyan-500/10 group-hover:to-purple-500/10"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Product badge */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          {product.isNew && (
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          )}
          {product.discount && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
              <Flame className="h-3 w-3 mr-1" />
              {product.discount}% OFF
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <motion.button
          className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
        </motion.button>

        {/* Product image with parallax effect */}
        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: isHovered ? 1.1 : 1,
              rotateZ: isHovered ? 3 : 0,
            }}
            transition={{ duration: 0.4 }}
          >
            <product.icon className="h-32 w-32 text-blue-500/30 dark:text-blue-400/30" />
          </motion.div>

          {/* Quick view button */}
          <motion.div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.2 }}
          >
            <Button size="sm" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-xl">
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </motion.div>
        </div>

        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold">{product.rating}</span>
            </div>
          </div>
          <CardTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {product.name}
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                ${product.originalPrice}
              </span>
            )}
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ${product.price}
            </span>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Animated stats counter
const AnimatedCounter = ({ value, suffix = "" }: { value: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const target = parseInt(value.replace(/\D/g, ""));

  useEffect(() => {
    if (isInView && target) {
      let start = 0;
      const duration = 2000;
      const increment = target / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, target]);

  return (
    <span ref={ref} className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
      {isInView ? (target ? count.toLocaleString() : value) : "0"}{suffix}
    </span>
  );
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const featuredProducts = [
    {
      name: "Premium Supply Chain Tracker",
      description: "Real-time tracking with blockchain verification and instant alerts",
      category: "Electronics",
      price: "299",
      originalPrice: "399",
      discount: 25,
      rating: "4.9",
      isNew: true,
      icon: Package,
    },
    {
      name: "Smart Inventory Manager",
      description: "AI-powered inventory management with predictive analytics",
      category: "Software",
      price: "199",
      rating: "4.8",
      isNew: true,
      icon: Warehouse,
    },
    {
      name: "Enterprise Security Suite",
      description: "Military-grade security with end-to-end encryption",
      category: "Security",
      price: "499",
      originalPrice: "699",
      discount: 30,
      rating: "5.0",
      icon: Shield,
    },
    {
      name: "Analytics Dashboard Pro",
      description: "Comprehensive analytics with real-time insights and reporting",
      category: "Analytics",
      price: "349",
      rating: "4.7",
      icon: BarChart3,
    },
    {
      name: "Blockchain Validator",
      description: "Advanced validation system with consensus protocols",
      category: "Blockchain",
      price: "599",
      originalPrice: "799",
      discount: 25,
      rating: "4.9",
      icon: CheckCircle,
    },
    {
      name: "Supply Chain Optimizer",
      description: "Optimize your supply chain with AI-driven recommendations",
      category: "Optimization",
      price: "449",
      rating: "4.8",
      isNew: true,
      icon: TrendingUp,
    },
  ];

  const categories = [
    { name: "Electronics", icon: Zap, count: "2,500+", color: "from-blue-500 to-cyan-500" },
    { name: "Security", icon: Shield, count: "1,200+", color: "from-green-500 to-emerald-500" },
    { name: "Analytics", icon: BarChart3, count: "850+", color: "from-purple-500 to-pink-500" },
    { name: "Blockchain", icon: Package, count: "3,000+", color: "from-orange-500 to-red-500" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Supply Chain Director",
      company: "Global Corp",
      content: "ChainVanguard transformed our supply chain operations. The transparency and efficiency gains have been remarkable.",
      rating: 5,
      avatar: Users,
    },
    {
      name: "Michael Chen",
      role: "CTO",
      company: "TechVentures Inc",
      content: "The blockchain integration is seamless. We've seen a 40% reduction in processing time and zero disputes.",
      rating: 5,
      avatar: Users,
    },
    {
      name: "Emily Rodriguez",
      role: "Operations Manager",
      company: "RetailMax",
      content: "Best investment we've made. The real-time tracking and analytics have revolutionized our inventory management.",
      rating: 5,
      avatar: Users,
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className="relative min-h-screen w-full">
      {/* Animated PixelBlast background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PixelBlast
          variant="circle"
          pixelSize={16}
          color="#2563eb"
          patternScale={2.2}
          patternDensity={0.5}
          pixelSizeJitter={0.08}
          enableRipples
          rippleSpeed={0.18}
          rippleThickness={0.09}
          rippleIntensityScale={0.7}
          liquid
          liquidStrength={0.07}
          liquidRadius={1.1}
          liquidWobbleSpeed={2.2}
          speed={0.22}
          edgeFade={0.22}
          transparent
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="min-h-screen bg-gradient-to-br from-slate-50/90 via-blue-50/90 to-cyan-50/90 dark:from-slate-950/90 dark:via-blue-950/90 dark:to-cyan-950/90 relative overflow-hidden">

          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [0, -90, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>

          {/* Header with glassmorphism */}
          <motion.header
            className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/30 sticky top-0 z-50 shadow-lg"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="container mx-auto px-6 flex h-16 items-center justify-between">
              <FocusMotionDiv className="flex items-center space-x-3 cursor-pointer rounded-lg outline-none">
                <motion.div
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Package className="h-6 w-6 text-white" />
                </motion.div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  ChainVanguard
                </span>
              </FocusMotionDiv>

              {/* Search bar */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              <nav className="flex items-center space-x-4">
                <FocusMotionDiv className="rounded-lg outline-none">
                  <ThemeToggle />
                </FocusMotionDiv>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </div>
                </motion.button>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </nav>
            </div>
          </motion.header>

          {/* Hero Section with parallax */}
          <section className="py-24 relative overflow-hidden">
            <motion.div style={{ opacity, scale }} className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left content */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-8"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 mb-6">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Limited Time Offer - Up to 30% OFF
                    </Badge>
                  </motion.div>

                  <motion.h1
                    className="text-5xl md:text-7xl font-extrabold leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      Future of
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                      E-Commerce
                    </span>
                  </motion.h1>

                  <motion.p
                    className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    Experience the next generation of supply chain management with blockchain-powered transparency, AI-driven insights, and military-grade security.
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Link href="/register">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-14 px-8 text-lg font-semibold shadow-2xl">
                          Shop Now
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </motion.div>
                    </Link>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 hover:bg-white/50 dark:hover:bg-gray-800/50">
                        <Gift className="mr-2 h-5 w-5" />
                        View Deals
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Trust badges */}
                  <motion.div
                    className="flex flex-wrap gap-6 pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    {[
                      { icon: Truck, text: "Free Shipping" },
                      { icon: Shield, text: "Secure Payment" },
                      { icon: Award, text: "Top Quality" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right content - Floating product showcase */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <motion.div
                    animate={{
                      y: [0, -20, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative z-10"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-3xl opacity-30" />
                      <Card className="relative border border-white/20 dark:border-gray-700/30 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                        <div className="h-96 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center relative">
                          <Package className="h-48 w-48 text-blue-500/50 dark:text-blue-400/50" />
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0">
                              <Flame className="h-3 w-3 mr-1" />
                              HOT DEAL
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-2xl font-bold mb-2">Featured Product</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Premium blockchain tracking system with real-time analytics
                          </p>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-gray-500 line-through">$599</span>
                              <span className="text-3xl font-bold text-blue-600 ml-2">$399</span>
                            </div>
                            <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>

                  {/* Floating elements */}
                  <motion.div
                    animate={{
                      y: [0, -30, 0],
                      x: [0, 20, 0],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-10 -right-10 h-32 w-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"
                  />
                  <motion.div
                    animate={{
                      y: [0, 30, 0],
                      x: [0, -20, 0],
                    }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute -bottom-10 -left-10 h-40 w-40 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-2xl"
                  />
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Categories Section */}
          <section className="py-16 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Shop by Category
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Explore our wide range of products
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="group cursor-pointer border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                      <CardContent className="p-8 text-center relative z-10">
                        <motion.div
                          className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <category.icon className="h-10 w-10 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{category.count} Products</p>
                        <div className="mt-4 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold">
                          Explore <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Products Section */}
          <section className="py-20 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex justify-between items-center mb-12"
              >
                <div>
                  <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Featured Products
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Our best-selling blockchain solutions
                  </p>
                </div>
                <Button variant="outline" size="lg" className="hidden md:flex">
                  View All
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product, idx) => (
                  <ProductCard key={idx} product={product} index={idx} />
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section with animated counters */}
          <section className="py-20 relative">
            <div className="container mx-auto px-6">
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-2xl bg-gradient-to-br from-blue-600 to-cyan-600 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-cyan-500/50" />
                <CardContent className="p-12 relative z-10">
                  <div className="grid md:grid-cols-4 gap-8 text-center text-white">
                    {[
                      { value: "10M+", label: "Products Sold", icon: Package },
                      { value: "500K+", label: "Happy Customers", icon: Users },
                      { value: "99.9%", label: "Satisfaction Rate", icon: Star },
                      { value: "24/7", label: "Support", icon: MessageCircle },
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="space-y-3"
                      >
                        <stat.icon className="h-12 w-12 mx-auto text-white/90" />
                        <AnimatedCounter value={stat.value} />
                        <div className="text-lg font-semibold text-white/90">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Testimonials Carousel */}
          <section className="py-20 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  What Our Customers Say
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Trusted by thousands of businesses worldwide
                </p>
              </motion.div>

              <div className="max-w-4xl mx-auto relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border border-white/20 dark:border-gray-700/30 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                      <CardContent className="p-12 text-center">
                        <div className="flex justify-center mb-6">
                          {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                            <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
                          "{testimonials[currentSlide].content}"
                        </p>
                        <div className="flex items-center justify-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            {(() => {
                              const AvatarIcon = testimonials[currentSlide].avatar;
                              return <AvatarIcon className="h-8 w-8 text-white" />;
                            })()}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-lg">{testimonials[currentSlide].name}</div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {testimonials[currentSlide].role} at {testimonials[currentSlide].company}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-3 w-3 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? "bg-blue-600 w-8"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="py-20 relative">
            <div className="container mx-auto px-6">
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 backdrop-blur-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <CardContent className="p-12 text-center relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
                      <Mail className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-4">
                      Join Our Newsletter
                    </h2>
                    <p className="text-xl text-white/90 mb-8">
                      Get exclusive deals, new product launches, and insider tips
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="flex-1 px-6 py-3 rounded-lg bg-white/90 backdrop-blur-sm border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-gray-900"
                      />
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                        Subscribe
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-white/70 mt-4">
                      🎁 Get 10% off your first order when you subscribe
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/20 dark:border-gray-700/30 py-12 bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                {/* Company */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-bold">ChainVanguard</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Revolutionizing e-commerce with blockchain technology
                  </p>
                  <div className="flex gap-3">
                    {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Shop */}
                <div>
                  <h3 className="font-bold mb-4">Shop</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">All Products</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Categories</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">New Arrivals</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Best Sellers</Link></li>
                  </ul>
                </div>

                {/* Company */}
                <div>
                  <h3 className="font-bold mb-4">Company</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Press</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                  </ul>
                </div>

                {/* Support */}
                <div>
                  <h3 className="font-bold mb-4">Support</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Help Center</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Shipping Info</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Returns</Link></li>
                    <li><Link href="#" className="hover:text-blue-600 transition-colors">Track Order</Link></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-8 text-center">
                <div className="flex flex-wrap justify-center gap-4 mb-4">
                  {["Next.js", "TypeScript", "Hyperledger Fabric", "IPFS", "Web3"].map((tech, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  © {new Date().getFullYear()} ChainVanguard. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
