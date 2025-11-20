"use client";

import React, { useState } from "react";
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

// Mock return requests
const MOCK_RETURNS = [
  {
    id: "RET001",
    orderId: "ORD12345",
    product: {
      name: "Classic Denim Jacket",
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
      price: 89.99,
      sku: "DENIM-001",
    },
    reason: "Size doesn't fit",
    description: "The jacket is too small. I need a larger size.",
    images: ["image1.jpg", "image2.jpg"],
    status: "pending",
    submittedDate: "2024-01-15T10:30:00",
    trackingNumber: null,
  },
  {
    id: "RET002",
    orderId: "ORD12344",
    product: {
      name: "Summer Dress",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500",
      price: 59.99,
      sku: "DRESS-005",
    },
    reason: "Damaged/Defective",
    description: "The dress arrived with a tear in the fabric.",
    images: ["image3.jpg"],
    status: "approved",
    submittedDate: "2024-01-10T14:20:00",
    approvedDate: "2024-01-11T09:15:00",
    trackingNumber: "TRK789012345",
  },
  {
    id: "RET003",
    orderId: "ORD12340",
    product: {
      name: "Leather Wallet",
      image:
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=500",
      price: 39.99,
      sku: "WALLET-003",
    },
    reason: "Wrong item received",
    description: "I ordered a black wallet but received brown.",
    images: ["image4.jpg"],
    status: "rejected",
    submittedDate: "2024-01-08T11:30:00",
    rejectedDate: "2024-01-09T10:00:00",
    rejectionReason: "Item shows signs of use beyond inspection.",
  },
];

const RETURN_REASONS = [
  "Size doesn't fit",
  "Damaged/Defective",
  "Wrong item received",
  "Not as described",
  "Changed my mind",
  "Quality issues",
  "Other",
];

type TabType = "submit" | "pending" | "approved" | "rejected";

export default function ReturnsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams?.get("orderId");

  const [activeTab, setActiveTab] = useState<TabType>("submit");
  const [selectedReason, setSelectedReason] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock product (would come from order in real app)
  const [selectedProduct] = useState({
    name: "Classic Denim Jacket",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    price: 89.99,
    sku: "DENIM-001",
    orderId: preselectedOrderId || "ORD12345",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    setUploadedImages([...uploadedImages, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // API call to submit return request
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Return request submitted successfully");
      setSelectedReason("");
      setDescription("");
      setUploadedImages([]);
      setActiveTab("pending");
    } catch (error) {
      toast.error("Failed to submit return request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <ClockIcon className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.2em]">Pending</span>
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
      default:
        return null;
    }
  };

  const filteredReturns = MOCK_RETURNS.filter((ret) => {
    if (activeTab === "submit") return false;
    if (activeTab === "pending") return ret.status === "pending";
    if (activeTab === "approved") return ret.status === "approved";
    if (activeTab === "rejected") return ret.status === "rejected";
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                activeTab === "submit"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Submit Return
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                activeTab === "pending"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Pending (
              {MOCK_RETURNS.filter((r) => r.status === "pending").length})
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                activeTab === "approved"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Approved (
              {MOCK_RETURNS.filter((r) => r.status === "approved").length})
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-8 h-14 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors border-b-2 ${
                activeTab === "rejected"
                  ? "border-black dark:border-white text-gray-900 dark:text-white"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Rejected (
              {MOCK_RETURNS.filter((r) => r.status === "rejected").length})
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
              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Product Info */}
                <div>
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                    Product Information
                  </h2>

                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-center gap-8">
                      <div className="h-24 w-24 bg-gray-100 dark:bg-gray-900 flex-shrink-0 overflow-hidden">
                        <img
                          src={selectedProduct.image}
                          alt={selectedProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-2">
                          {selectedProduct.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          SKU: {selectedProduct.sku}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ${selectedProduct.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Order ID
                        </p>
                        <p className="text-sm font-mono text-gray-900 dark:text-white">
                          {selectedProduct.orderId}
                        </p>
                      </div>
                    </div>
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
                        key={reason}
                        type="button"
                        onClick={() => setSelectedReason(reason)}
                        className={`p-6 text-left border transition-colors ${
                          selectedReason === reason
                            ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                        }`}
                      >
                        <p className="text-sm text-gray-900 dark:text-white">
                          {reason}
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
                        Provide detailed information about why you're returning
                        this item
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
                              className="absolute top-2 right-2 h-6 w-6 bg-white dark:bg-gray-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                    disabled={isSubmitting}
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Return Request"
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Returns List */
            <div className="space-y-8">
              {filteredReturns.length > 0 ? (
                filteredReturns.map((returnItem) => (
                  <div
                    key={returnItem.id}
                    className="border border-gray-200 dark:border-gray-800 p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="space-y-8">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <h3 className="text-sm font-mono text-gray-900 dark:text-white">
                              {returnItem.id}
                            </h3>
                            {getStatusBadge(returnItem.status)}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Submitted on {formatDate(returnItem.submittedDate)}
                          </p>
                        </div>

                        <button
                          onClick={() =>
                            router.push(`/customer/returns/${returnItem.id}`)
                          }
                          className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Product */}
                      <div className="flex items-center gap-6 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div className="h-20 w-20 bg-gray-100 dark:bg-gray-900 flex-shrink-0 overflow-hidden">
                          <img
                            src={returnItem.product.image}
                            alt={returnItem.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {returnItem.product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Order: {returnItem.orderId}
                          </p>
                          <p className="text-xs text-gray-900 dark:text-white">
                            ${returnItem.product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Reason & Description */}
                      <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">
                            Reason
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {returnItem.reason}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">
                            Description
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {returnItem.description}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {returnItem.status === "approved" &&
                        returnItem.trackingNumber && (
                          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 bg-green-50 dark:bg-green-900/20 p-6">
                            <div className="flex items-start gap-3">
                              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  Return Approved
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Approved on{" "}
                                  {formatDate(returnItem.approvedDate!)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Tracking: {returnItem.trackingNumber}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      {returnItem.status === "rejected" &&
                        returnItem.rejectionReason && (
                          <div className="pt-8 border-t border-gray-200 dark:border-gray-800 bg-red-50 dark:bg-red-900/20 p-6">
                            <div className="flex items-start gap-3">
                              <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  Return Rejected
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Rejected on{" "}
                                  {formatDate(returnItem.rejectedDate!)}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  Reason: {returnItem.rejectionReason}
                                </p>
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
                        You don't have any {activeTab} return requests
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
