/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
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
  Flame,
  ArrowUpRight,
  ChevronRight,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
  Search,
  Cpu,
  Globe,
  Lock,
  Database,
  Clock,
  CreditCard,
  Smartphone,
  Box,
  Play,
  Check,
  X,
  ChevronDown,
  Bell,
  Headphones,
  RefreshCw,
  MapPin,
  Download,
  QrCode,
  PhoneCall,
  HelpCircle,
  FileText,
  DollarSign,
  Percent,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import PixelBlast from "@/components/PixelBlast";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";

// Animated product card
const ProductCard = ({ product, index }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 30, rotateX: -10 }}
      transition={{ duration: 0.5, delay: index * 0.08, type: "spring" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -12, scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-900 h-full">
        <motion.div
          className="absolute inset-0 bg-blue-500/5"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />

        <div className="absolute top-3 left-3 z-10 flex gap-1.5">
          {product.isNew && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Badge className="bg-pink-500 text-white border-0 text-[10px] px-2 py-0.5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                New
              </Badge>
            </motion.div>
          )}
          {product.discount && (
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Badge className="bg-red-500 text-white border-0 text-[10px] px-2 py-0.5">
                <Percent className="h-2.5 w-2.5 mr-1" />
                {product.discount}% OFF
              </Badge>
            </motion.div>
          )}
        </div>

        <motion.button
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700"
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.8 }}
        >
          <Heart className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-red-500 transition-colors" />
        </motion.button>

        <div className="relative h-48 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: isHovered ? 1.15 : 1,
              rotateZ: isHovered ? 3 : 0,
            }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <product.icon className="h-24 w-24 text-blue-500/20" />
          </motion.div>

          <motion.div
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
          >
            <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 shadow-md text-xs h-8">
              <Eye className="h-3 w-3 mr-1.5" />
              Quick View
            </Button>
          </motion.div>
        </div>

        <CardHeader className="relative z-10 pb-2 px-4 pt-4">
          <div className="flex items-start justify-between mb-1.5">
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-blue-500 text-blue-600">
              {product.category}
            </Badge>
            <motion.div
              className="flex items-center gap-0.5"
              whileHover={{ scale: 1.1 }}
            >
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold">{product.rating}</span>
            </motion.div>
          </div>
          <CardTitle className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
            {product.name}
          </CardTitle>
          <CardDescription className="text-xs line-clamp-2 leading-relaxed">
            {product.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-2.5 px-4 pb-4">
          <div className="flex items-center gap-2">
            {product.originalPrice && (
              <motion.span
                className="text-xs text-gray-500 line-through"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                ${product.originalPrice}
              </motion.span>
            )}
            <motion.span
              className="text-xl font-bold text-blue-600"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              ${product.price}
            </motion.span>
          </div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs h-9">
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
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
    <motion.span
      ref={ref}
      className="text-2xl font-bold text-white"
      initial={{ scale: 0 }}
      animate={isInView ? { scale: 1 } : { scale: 0 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {isInView ? (target ? count.toLocaleString() : value) : "0"}{suffix}
    </motion.span>
  );
};

// Live notification
const LiveNotification = ({ notification, index }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0"
      >
        <ShoppingCart className="h-5 w-5 text-blue-600" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
          {notification.user}
        </p>
        <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
          purchased {notification.product}
        </p>
      </div>
      <span className="text-[10px] text-gray-500">{notification.time}</span>
    </motion.div>
  );
};

// FAQ Item
const FAQItem = ({ faq, index }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <motion.div
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
        whileHover={{ scale: 1.01 }}
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          whileTap={{ scale: 0.99 }}
        >
          <span className="font-medium text-sm">{faq.question}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </motion.div>
        </motion.button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {faq.answer}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");
  const [liveNotifications, setLiveNotifications] = useState([
    { user: "John D.", product: "Security Suite", time: "2m ago" },
    { user: "Sarah M.", product: "Analytics Pro", time: "5m ago" },
    { user: "Mike K.", product: "Blockchain Tool", time: "8m ago" },
  ]);

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
    { id: "all", name: "All Products", icon: Package, count: "10,000+" },
    { id: "electronics", name: "Electronics", icon: Zap, count: "2,500+" },
    { id: "security", name: "Security", icon: Shield, count: "1,200+" },
    { id: "analytics", name: "Analytics", icon: BarChart3, count: "850+" },
  ];

  const features = [
    { icon: ShieldCheck, title: "Secure Transactions", description: "Bank-level encryption for all payments" },
    { icon: Truck, title: "Free Shipping", description: "On orders over $100 worldwide" },
    { icon: RefreshCw, title: "30-Day Returns", description: "Money-back guarantee" },
    { icon: Headphones, title: "24/7 Support", description: "Expert help anytime" },
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

  const faqs = [
    {
      question: "How do I track my order?",
      answer: "You can track your order in real-time using the tracking number sent to your email. Simply enter it in the tracking section or log in to your account to see live updates.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and cryptocurrency payments including Bitcoin and Ethereum.",
    },
    {
      question: "Can I return a product?",
      answer: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied with your purchase, you can return it within 30 days for a full refund, no questions asked.",
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to over 150 countries worldwide. Shipping times vary by location, but typically take 5-10 business days. Free shipping is available on orders over $100.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use military-grade encryption and blockchain technology to ensure your data is completely secure. All transactions are protected and your information is never shared with third parties.",
    },
  ];

  const paymentMethods = [
    { name: "Visa", icon: CreditCard },
    { name: "Mastercard", icon: CreditCard },
    { name: "PayPal", icon: DollarSign },
    { name: "Apple Pay", icon: Smartphone },
    { name: "Google Pay", icon: Smartphone },
    { name: "Crypto", icon: Database },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  // Simulate live notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const newNotif = {
        user: ["Alex T.", "Emma W.", "Chris P.", "Lisa M."][Math.floor(Math.random() * 4)],
        product: ["Security Suite", "Analytics Pro", "Blockchain Tool", "Inventory Manager"][Math.floor(Math.random() * 4)],
        time: "Just now",
      };
      setLiveNotifications((prev) => [newNotif, ...prev.slice(0, 2)]);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full">
      {/* Animated PixelBlast background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <PixelBlast
          variant="circle"
          pixelSize={16}
          color="#3b82f6"
          patternScale={2.2}
          patternDensity={0.3}
          pixelSizeJitter={0.08}
          enableRipples
          rippleSpeed={0.18}
          rippleThickness={0.09}
          rippleIntensityScale={0.5}
          liquid
          liquidStrength={0.05}
          liquidRadius={1.1}
          liquidWobbleSpeed={2.2}
          speed={0.22}
          edgeFade={0.22}
          transparent
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <div className="min-h-screen bg-white dark:bg-gray-950 relative overflow-hidden">

          {/* Header */}
          <motion.header
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="container mx-auto px-6 flex h-14 items-center justify-between">
              <motion.div
                className="flex items-center space-x-2.5 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md"
                  animate={{ rotate: [0, 10, 0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <Package className="h-4.5 w-4.5 text-white" />
                </motion.div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ChainVanguard
                </span>
              </motion.div>

              {/* Search bar */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <motion.div
                  className="relative w-full"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </motion.div>
              </div>

              <nav className="flex items-center space-x-3">
                <ThemeToggle />
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    <motion.span
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      3
                    </motion.span>
                  </div>
                </motion.button>
                <Link href="/login">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="text-sm h-9 px-3">
                      Login
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm h-9 px-4">
                      Get Started
                    </Button>
                  </motion.div>
                </Link>
              </nav>
            </div>
          </motion.header>

          {/* Hero Section */}
          <section className="py-16 relative overflow-hidden bg-blue-50 dark:bg-blue-950/20">
            <motion.div style={{ opacity, scale }} className="container mx-auto px-6">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Badge className="bg-pink-500 text-white border-0 text-xs px-3 py-1">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Limited Time Offer - Up to 30% OFF
                    </Badge>
                  </motion.div>

                  <motion.h1
                    className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 dark:text-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Future of
                    </motion.span>
                    <br />
                    <span className="text-blue-600">
                      E-Commerce
                    </span>
                  </motion.h1>

                  <motion.p
                    className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    Experience the next generation of supply chain management with blockchain-powered transparency, AI-driven insights, and military-grade security.
                  </motion.p>

                  <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Link href="/register">
                      <motion.div
                        whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-11 px-6 text-sm font-semibold shadow-lg">
                          Shop Now
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </Link>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" variant="outline" className="h-11 px-6 text-sm font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                        <Play className="mr-2 h-4 w-4" />
                        Watch Demo
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Trust badges */}
                  <motion.div
                    className="flex flex-wrap gap-4 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    {[
                      { icon: Truck, text: "Free Shipping" },
                      { icon: Shield, text: "Secure Payment" },
                      { icon: Award, text: "Top Quality" },
                    ].map((item, idx) => (
                      <motion.div
                        key={idx}
                        className="flex items-center gap-2"
                        whileHover={{ scale: 1.1, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <item.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Right content */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10"
                  >
                    <Card className="relative border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900 overflow-hidden">
                      <div className="h-72 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Package className="h-32 w-32 text-blue-500/30" />
                        </motion.div>
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-pink-500 text-white border-0 text-xs px-2.5 py-1">
                            <Flame className="h-3 w-3 mr-1" />
                            HOT DEAL
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="text-lg font-bold mb-1.5">Featured Product</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Premium blockchain tracking system with real-time analytics
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500 line-through">$599</span>
                            <span className="text-2xl font-bold text-blue-600 ml-2">$399</span>
                          </div>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9">
                              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                              Add to Cart
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Live Activity Section */}
          <section className="py-8 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between mb-4"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bell className="h-5 w-5 text-blue-600" />
                  </motion.div>
                  <h3 className="text-sm font-semibold">Live Activity</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  <motion.div
                    className="h-2 w-2 rounded-full bg-green-500 mr-2"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  Live
                </Badge>
              </motion.div>
              <div className="grid md:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {liveNotifications.map((notif, idx) => (
                    <LiveNotification key={`${notif.user}-${idx}`} notification={notif} index={idx} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Categories with filter */}
          <section className="py-12 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  Shop by Category
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Explore our wide range of products
                </p>
              </motion.div>

              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {categories.map((category, idx) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                      activeCategory === category.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <category.icon className="h-4 w-4" />
                      {category.name}
                      <Badge variant="secondary" className="text-[10px]">
                        {category.count}
                      </Badge>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-14 relative bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex justify-between items-center mb-8"
              >
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    Featured Products
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Our best-selling blockchain solutions
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="hidden md:flex text-xs h-9">
                    View All
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              </motion.div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product, idx) => (
                  <ProductCard key={idx} product={product} index={idx} />
                ))}
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section className="py-14 relative">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="text-center p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all bg-white dark:bg-gray-900">
                      <motion.div
                        className="h-14 w-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4"
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="h-7 w-7 text-blue-600" />
                      </motion.div>
                      <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-12 relative bg-blue-600">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
                {[
                  { value: "10M+", label: "Products Sold", icon: Package },
                  { value: "500K+", label: "Happy Customers", icon: Users },
                  { value: "99.9%", label: "Satisfaction", icon: Star },
                  { value: "24/7", label: "Support", icon: MessageCircle },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="space-y-2"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                    >
                      <stat.icon className="h-8 w-8 mx-auto text-white/90" />
                    </motion.div>
                    <AnimatedCounter value={stat.value} />
                    <div className="text-xs font-medium text-white/90">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-14 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10"
              >
                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 mb-4 text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  FAQ
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Find answers to common questions about our platform
                </p>
              </motion.div>

              <div className="max-w-3xl mx-auto space-y-3">
                {faqs.map((faq, idx) => (
                  <FAQItem key={idx} faq={faq} index={idx} />
                ))}
              </div>
            </div>
          </section>

          {/* Payment Methods */}
          <section className="py-12 relative bg-gray-50 dark:bg-gray-900/50">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  {paymentMethods.map((method, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                      whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                      className="h-12 w-12 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm"
                    >
                      <method.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-14 relative">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-8"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                  What Our Customers Say
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trusted by thousands of businesses worldwide
                </p>
              </motion.div>

              <div className="max-w-3xl mx-auto relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 30, rotateY: 90 }}
                    animate={{ opacity: 1, x: 0, rotateY: 0 }}
                    exit={{ opacity: 0, x: -30, rotateY: -90 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card className="border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
                      <CardContent className="p-8 text-center">
                        <motion.div
                          className="flex justify-center mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        >
                          {[...Array(testimonials[currentSlide].rating)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                            >
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            </motion.div>
                          ))}
                        </motion.div>
                        <p className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                          "{testimonials[currentSlide].content}"
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                            {(() => {
                              const AvatarIcon = testimonials[currentSlide].avatar;
                              return <AvatarIcon className="h-6 w-6 text-white" />;
                            })()}
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-sm">{testimonials[currentSlide].name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {testimonials[currentSlide].role} at {testimonials[currentSlide].company}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-center gap-2 mt-6">
                  {testimonials.map((_, idx) => (
                    <motion.button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? "bg-blue-600 w-6"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                      whileHover={{ scale: 1.5 }}
                      whileTap={{ scale: 0.8 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Newsletter Section */}
          <section className="py-12 relative bg-purple-600">
            <div className="container mx-auto px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-xl mx-auto text-center"
              >
                <motion.div
                  className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Mail className="h-7 w-7 text-white" />
                </motion.div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Join Our Newsletter
                </h2>
                <p className="text-sm text-white/90 mb-6">
                  Get exclusive deals, new product launches, and insider tips
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-white/90 border-0 focus:outline-none focus:ring-2 focus:ring-white/50 text-gray-900"
                  />
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="sm" className="bg-white text-purple-600 hover:bg-gray-100 h-10 px-5 text-sm font-semibold">
                      Subscribe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
                <p className="text-xs text-white/70 mt-3">
                  Get 10% off your first order when you subscribe
                </p>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-gray-200 dark:border-gray-700 py-10 bg-white dark:bg-gray-950">
            <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Package className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-base font-bold">ChainVanguard</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                    Revolutionizing e-commerce with blockchain technology
                  </p>
                  <div className="flex gap-2">
                    {[Facebook, Twitter, Instagram, Linkedin].map((Icon, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        whileTap={{ scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm">Shop</h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    {["All Products", "Categories", "New Arrivals", "Best Sellers"].map((item, idx) => (
                      <motion.li key={idx} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Link href="#" className="hover:text-blue-600 transition-colors">{item}</Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm">Company</h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    {["About Us", "Careers", "Press", "Contact"].map((item, idx) => (
                      <motion.li key={idx} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Link href="#" className="hover:text-blue-600 transition-colors">{item}</Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 text-sm">Support</h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    {["Help Center", "Shipping Info", "Returns", "Track Order"].map((item, idx) => (
                      <motion.li key={idx} whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
                        <Link href="#" className="hover:text-blue-600 transition-colors">{item}</Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 text-center">
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {["Next.js", "TypeScript", "Hyperledger Fabric", "IPFS", "Web3"].map((tech, idx) => (
                    <motion.div key={idx} whileHover={{ scale: 1.1, y: -2 }}>
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
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
