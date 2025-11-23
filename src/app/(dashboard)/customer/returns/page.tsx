/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRightIcon,
  PhotoIcon,
  XMarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  getCustomerReturns,
  getEligibleOrders,
  createReturn,
  uploadReturnImages,
  type ReturnRequest,
  type ReturnReason,
} from "@/lib/api/customer.returns.api";
import type { Order } from "@/types";
import { usePageTitle } from "@/hooks/use-page-title";

const RETURN_REASONS: Array<{ value: ReturnReason; label: string }> = [
  { value: "defective", label: "Product is Defective" },
  { value: "damaged", label: "Product Damaged" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "not_as_described", label: "Not as Described" },
  { value: "size_issue", label: "Size Doesn't Fit" },
  { value: "quality_issues", label: "Quality Issues" },
  { value: "changed_mind", label: "Changed My Mind" },
  { value: "other", label: "Other Reason" },
];

type TabType = "submit" | "requested" | "approved" | "rejected" | "refunded";

export default function ReturnsPage() {
  usePageTitle("My Returns");
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams?.get("orderId");

  const [activeTab, setActiveTab] = useState<TabType>("submit");
  const [selectedReason, setSelectedReason] = useState<ReturnReason | "">("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load returns when tab changes
  useEffect(() => {
    if (activeTab !== "submit") {
      loadReturns();
    }
  }, [activeTab]);

  // Load eligible orders on mount
  useEffect(() => {
    loadEligibleOrders();
  }, []);

  // Pre-select order if provided in URL
  useEffect(() => {
    if (preselectedOrderId && eligibleOrders.length > 0) {
      const order = eligibleOrders.find((o) => o._id === preselectedOrderId);
      if (order) {
        setSelectedOrder(order);
        setActiveTab("submit");
      }
    }
  }, [preselectedOrderId, eligibleOrders]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const statusMap: Record<TabType, string | undefined> = {
        submit: undefined,
        requested: "requested",
        approved: "approved",
        rejected: "rejected",
        refunded: "refunded",
      };

      const response = await getCustomerReturns({
        status: statusMap[activeTab] as any,
        page: 1,
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success && response.returns) {
        setReturns(response.returns);
      } else {
        toast.error("Failed to load returns");
      }
    } catch (error: any) {
      console.error("Error loading returns:", error);
      toast.error(error.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  const loadEligibleOrders = async () => {
    try {
      const orders = await getEligibleOrders();
      setEligibleOrders(orders);

      // Auto-select first order if available
      if (orders.length > 0 && !selectedOrder) {
        setSelectedOrder(orders[0]);
      }
    } catch (error: any) {
      console.error("Error loading eligible orders:", error);
      toast.error("Failed to load orders");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    // Check file sizes (max 10MB each)
    const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be less than 10MB");
      return;
    }

    setUploadedImages([...uploadedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      toast.error("Please select an order");
      return;
    }

    if (!selectedReason) {
      toast.error("Please select a return reason");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images to Cloudinary
      setUploading(true);
      toast.loading("Uploading images...");
      const imageUrls = await uploadReturnImages(uploadedImages);
      toast.dismiss();
      toast.success("Images uploaded successfully");
      setUploading(false);

      // Create return request with all order items
      const returnData = {
        orderId: selectedOrder._id || selectedOrder.id || "",
        items: selectedOrder.items.map((item) => ({
          productId:
            typeof item.productId === "string"
              ? item.productId
              : item.productId._id,
          quantity: item.quantity,
        })),
        reason: selectedReason as ReturnReason,
        reasonDetails: description,
        images: imageUrls.map((img) => img.url),
      };

      const response = await createReturn(returnData);

      if (response.success) {
        toast.success("Return request submitted successfully");
        setSelectedReason("");
        setDescription("");
        setUploadedImages([]);
        setSelectedOrder(null);
        setActiveTab("requested");
        loadEligibleOrders(); // Refresh eligible orders
      } else {
        toast.error(response.message || "Failed to submit return request");
      }
    } catch (error: any) {
      console.error("Submit return error:", error);
      toast.error(error.message || "Failed to submit return request");
    } finally {
      setIsSubmitting(false);
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <ClockIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">
              Requested
            </span>
          </div>
        );
      case "approved":
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Approved</span>
          </div>
        );
      case "rejected":
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <XCircleIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Rejected</span>
          </div>
        );
      case "refunded":
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Refunded</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getReturnsCounts = () => {
    return {
      requested: returns.filter((r) => r.status === "requested").length,
      approved: returns.filter((r) => r.status === "approved").length,
      rejected: returns.filter((r) => r.status === "rejected").length,
      refunded: returns.filter((r) => r.status === "refunded").length,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProductImage = (order: Order) => {
    const firstItem = order.items[0];
    if (!firstItem) return "";

    const product =
      typeof firstItem.productId === "object" ? firstItem.productId : null;
    return (
      product?.images?.[0]?.url ||
      firstItem.productSnapshot?.images?.[0]?.url ||
      firstItem.productImage ||
      ""
    );
  };

  const counts = getReturnsCounts();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800">
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
              Returns
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                Return Management
              </p>
            </div>
            <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
              Returns & Refunds
            </h1>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "submit"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Submit Return
            </button>
            <button
              onClick={() => setActiveTab("requested")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "requested"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Requested
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "approved"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "rejected"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setActiveTab("refunded")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "refunded"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Refunded
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {activeTab === "submit" ? (
            /* Submit Return Form */
            <div className="max-w-4xl">
              {eligibleOrders.length === 0 ? (
                <div className="text-center py-32 border border-gray-200 dark:border-gray-800">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-extralight text-gray-900 dark:text-white">
                        No Eligible Orders
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You don&apos;t have any delivered orders that can be
                        returned
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-12">
                  {/* Order Selection */}
                  <div>
                    <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                      Select Order
                    </h2>

                    <div className="grid gap-4">
                      {eligibleOrders.map((order) => (
                        <button
                          key={order._id || order.id}
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className={`p-6 text-left border transition-colors ${
                            selectedOrder?._id === order._id ||
                            selectedOrder?.id === order.id
                              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="h-20 w-20 bg-gray-100 dark:bg-gray-900 flex-shrink-0 overflow-hidden">
                              {getProductImage(order) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={getProductImage(order)}
                                  alt="Product"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <CubeIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                {order.items.length} item
                                {order.items.length !== 1 ? "s" : ""} • CVT{" "}
                                {order.total.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Delivered {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Return Reason */}
                  <div>
                    <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                      Return Reason
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                      {RETURN_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => setSelectedReason(reason.value)}
                          className={`p-6 text-left border transition-colors ${
                            selectedReason === reason.value
                              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                              : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                          }`}
                        >
                          <p className="text-sm text-gray-900 dark:text-white">
                            {reason.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                      Description
                    </h2>

                    <div className="space-y-3">
                      <div className="border border-gray-200 dark:border-gray-800 p-6">
                        <textarea
                          value={description}
                          onChange={(e) => {
                            if (e.target.value.length <= 2000) {
                              setDescription(e.target.value);
                            }
                          }}
                          placeholder="Please describe the issue with your order in detail..."
                          className="w-full h-48 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Provide detailed information about why you&apos;re
                          returning this item
                        </p>
                        <p
                          className={`text-xs ${
                            description.length >= 2000
                              ? "text-red-500"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {description.length}/2000
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                      Upload Images
                    </h2>

                    <div className="space-y-6">
                      {/* Upload Area */}
                      <label className="block border-2 border-dashed border-gray-200 dark:border-gray-800 p-12 hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading || isSubmitting}
                        />
                        <div className="text-center space-y-4">
                          <div className="flex justify-center">
                            <PhotoIcon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white mb-2">
                              Click to upload images
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PNG, JPG up to 10MB (Max 5 images)
                            </p>
                          </div>
                        </div>
                      </label>

                      {/* Preview Images */}
                      {uploadedImages.length > 0 && (
                        <div className="grid grid-cols-5 gap-4">
                          {uploadedImages.map((file, index) => (
                            <div
                              key={index}
                              className="relative aspect-square border border-gray-200 dark:border-gray-800 group"
                            >
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                disabled={uploading || isSubmitting}
                                className="absolute top-2 right-2 h-6 w-6 bg-white dark:bg-gray-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                              >
                                <XMarkIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="submit"
                      disabled={isSubmitting || uploading}
                      className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting || uploading ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          {uploading ? "Uploading Images..." : "Submitting..."}
                        </>
                      ) : (
                        "Submit Return Request"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="text-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading returns...
              </p>
            </div>
          ) : (
            /* Returns List */
            <div className="space-y-8">
              {returns.length > 0 ? (
                returns.map((returnItem) => (
                  <div
                    key={returnItem._id}
                    className="border border-gray-200 dark:border-gray-800 p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="space-y-8">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <h3 className="text-sm font-mono text-gray-900 dark:text-white">
                              {returnItem.returnNumber}
                            </h3>
                            {getStatusBadge(returnItem.status)}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted on {formatDate(returnItem.createdAt)}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            router.push(`/customer/returns/${returnItem._id}`)
                          }
                          className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Items Info */}
                      <div className="flex items-center gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {returnItem.items.length} item
                            {returnItem.items.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Order: {returnItem.orderNumber}
                          </p>
                          <p className="text-xs text-gray-900 dark:text-white">
                            Return Amount: CVT{" "}
                            {returnItem.returnAmount.toFixed(2)}
                          </p>
                          {returnItem.refundAmount !==
                            returnItem.returnAmount && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Refund: CVT {returnItem.refundAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Reason & Description */}
                      <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">
                            Reason
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white capitalize">
                            {returnItem.reason.replace(/_/g, " ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">
                            Description
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {returnItem.reasonDetails}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {returnItem.status === "approved" && (
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/20 p-6">
                          <div className="flex items-start gap-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                Return Approved
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Please ship your item back within 14 days
                              </p>
                              {returnItem.reviewNotes && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Note: {returnItem.reviewNotes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {returnItem.status === "rejected" && (
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/20 p-6">
                          <div className="flex items-start gap-3">
                            <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                Return Rejected
                              </p>
                              {returnItem.rejectionReason && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Reason: {returnItem.rejectionReason}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {returnItem.status === "refunded" && (
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/20 p-6">
                          <div className="flex items-start gap-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                Refund Processed
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                CVT {returnItem.refundAmount.toFixed(2)} has
                                been refunded to your wallet
                              </p>
                              {returnItem.refundedAt && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Refunded on{" "}
                                  {formatDate(returnItem.refundedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-32 border border-gray-200 dark:border-gray-800">
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-extralight text-gray-900 dark:text-white">
                        No {activeTab} Returns
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You don&apos;t have any {activeTab} return requests
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

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
