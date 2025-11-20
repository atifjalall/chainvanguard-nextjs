"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
  CubeIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock return detail
const MOCK_RETURN_DETAIL = {
  id: "RET001",
  orderId: "ORD12345",
  product: {
    name: "Classic Denim Jacket",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    price: 89.99,
    sku: "DENIM-001",
    quantity: 1,
  },
  reason: "Size doesn't fit",
  description:
    "The jacket is too small for me. I ordered a medium but it fits more like a small. I would like to exchange it for a large size or get a refund. The product is in perfect condition with all tags still attached. I haven't worn it outside, only tried it on at home.",
  images: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500",
    "https://images.unsplash.com/photo-1525450824786-227cbef70703?w=500",
  ],
  status: "approved",
  submittedDate: "2024-01-15T10:30:00",
  reviewedDate: "2024-01-16T14:20:00",
  approvedDate: "2024-01-16T14:20:00",
  completedDate: null,
  rejectedDate: null,
  rejectionReason: null,
  trackingNumber: "TRK1234567890",
  refundAmount: 89.99,
  refundStatus: "processing",
  refundMethod: "Wallet",
  estimatedRefundDate: "2024-01-20T00:00:00",
  returnShippingAddress: {
    name: "Fashion Store Returns",
    address: "456 Return Center Blvd",
    city: "New York",
    state: "NY",
    zipCode: "10002",
  },
  timeline: [
    {
      status: "submitted",
      label: "Return Request Submitted",
      description: "Your return request has been received",
      timestamp: "2024-01-15T10:30:00",
      completed: true,
    },
    {
      status: "review",
      label: "Under Review",
      description: "Our team is reviewing your return request",
      timestamp: "2024-01-15T10:31:00",
      completed: true,
    },
    {
      status: "approved",
      label: "Return Approved",
      description: "Your return has been approved. Please ship the item back",
      timestamp: "2024-01-16T14:20:00",
      completed: true,
    },
    {
      status: "shipped",
      label: "Item Shipped Back",
      description: "Waiting for the item to be shipped back",
      timestamp: null,
      completed: false,
    },
    {
      status: "received",
      label: "Item Received",
      description: "Item will be inspected upon receipt",
      timestamp: null,
      completed: false,
    },
    {
      status: "refunded",
      label: "Refund Processed",
      description: "Refund will be issued to your wallet",
      timestamp: null,
      completed: false,
    },
  ],
  adminNotes: [
    {
      author: "Support Team",
      message:
        "Return approved. Product appears to be in original condition based on photos. Customer can return for full refund.",
      timestamp: "2024-01-16T14:20:00",
    },
  ],
};

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const returnId = params?.id || "RET001";

  const [returnDetail] = useState(MOCK_RETURN_DETAIL);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDownloadReceipt = () => {
    toast.success("Downloading return receipt...");
  };

  const handleContactSupport = () => {
    toast.success("Opening support chat...");
  };

  const getStatusIcon = () => {
    switch (returnDetail.status) {
      case "approved":
        return (
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        );
      case "pending":
        return (
          <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        );
      case "rejected":
        return (
          <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (returnDetail.status) {
      case "approved":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBgColor = () => {
    switch (returnDetail.status) {
      case "approved":
        return "bg-green-50 dark:bg-green-900/20";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "rejected":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900";
    }
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
            <button
              onClick={() => router.push("/customer/return")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Returns
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {returnDetail.id}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Return Details
                </p>
              </div>

              <div className="flex items-center gap-6">
                {getStatusIcon()}
                <div>
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    {returnDetail.id}
                  </h1>
                  <p
                    className={`text-sm uppercase tracking-[0.2em] ${getStatusColor()}`}
                  >
                    {returnDetail.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleContactSupport}
                className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Contact Support
              </button>
              <button
                onClick={handleDownloadReceipt}
                className="bg-black dark:bg-white text-white dark:text-black px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Product Information */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Product Information
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="flex items-start gap-8">
                    <div className="h-32 w-32 bg-gray-100 dark:bg-gray-900 flex-shrink-0 overflow-hidden">
                      <img
                        src={returnDetail.product.image}
                        alt={returnDetail.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-2">
                          {returnDetail.product.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          SKU: {returnDetail.product.sku}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                            Price
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            ${returnDetail.product.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                            Quantity
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {returnDetail.product.quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                            Order ID
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white font-mono">
                            {returnDetail.orderId}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Details */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Return Information
                </h2>

                <div className="border border-gray-200 dark:border-gray-800">
                  <div className="p-8 space-y-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Reason for Return
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {returnDetail.reason}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Description
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {returnDetail.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Images */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Uploaded Images
                </h2>

                <div className="grid grid-cols-3 gap-4">
                  {returnDetail.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedImage(index);
                        setShowImageModal(true);
                      }}
                      className="aspect-square border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white transition-colors overflow-hidden group"
                    >
                      <img
                        src={image}
                        alt={`Return image ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Return Timeline
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="space-y-8">
                    {returnDetail.timeline.map((step, index) => (
                      <div key={step.status} className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-10 w-10 flex items-center justify-center ${
                              step.completed
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-gray-100 dark:bg-gray-900"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
                            )}
                          </div>
                          {index !== returnDetail.timeline.length - 1 && (
                            <div
                              className={`w-px h-16 ${
                                step.completed
                                  ? "bg-green-600 dark:bg-green-400"
                                  : "bg-gray-200 dark:bg-gray-800"
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1 pb-8">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {step.description}
                          </p>
                          {step.timestamp && (
                            <p className="text-xs text-gray-400 dark:text-gray-600">
                              {formatDate(step.timestamp)} at{" "}
                              {formatTime(step.timestamp)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {returnDetail.adminNotes &&
                returnDetail.adminNotes.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                      Support Notes
                    </h2>

                    <div className="space-y-4">
                      {returnDetail.adminNotes.map((note, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                {note.author}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(note.timestamp)} at{" "}
                                {formatTime(note.timestamp)}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {note.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Status Card */}
              <div
                className={`border border-gray-200 dark:border-gray-800 p-8 ${getStatusBgColor()}`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    {getStatusIcon()}
                  </div>

                  <div>
                    <p
                      className={`text-lg font-medium uppercase tracking-[0.2em] ${getStatusColor()}`}
                    >
                      {returnDetail.status}
                    </p>
                  </div>

                  {returnDetail.status === "approved" && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <p className="text-xs text-gray-900 dark:text-white">
                        Please ship the item back to proceed with the refund.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Information */}
              {returnDetail.status === "approved" && (
                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Refund Information
                    </p>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Refund Amount
                        </p>
                        <p className="text-2xl font-extralight text-gray-900 dark:text-white">
                          ${returnDetail.refundAmount.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Refund Method
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {returnDetail.refundMethod}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Refund Status
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">
                          {returnDetail.refundStatus}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Estimated Refund Date
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {formatDate(returnDetail.estimatedRefundDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tracking Information */}
              {returnDetail.status === "approved" &&
                returnDetail.trackingNumber && (
                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <TruckIcon className="h-5 w-5 text-gray-900 dark:text-white opacity-70" />
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          Tracking Information
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Tracking Number
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-gray-900 dark:text-white font-mono">
                              {returnDetail.trackingNumber}
                            </p>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  returnDetail.trackingNumber!,
                                  "Tracking number"
                                )
                              }
                              className="flex-shrink-0"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Return Address */}
              {returnDetail.status === "approved" && (
                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Return Shipping Address
                    </p>

                    <div className="space-y-2 text-sm text-gray-900 dark:text-white">
                      <p className="font-medium">
                        {returnDetail.returnShippingAddress.name}
                      </p>
                      <p>{returnDetail.returnShippingAddress.address}</p>
                      <p>
                        {returnDetail.returnShippingAddress.city},{" "}
                        {returnDetail.returnShippingAddress.state}{" "}
                        {returnDetail.returnShippingAddress.zipCode}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Dates */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Important Dates
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white text-right">
                        {formatDate(returnDetail.submittedDate)}
                      </span>
                    </div>

                    {returnDetail.reviewedDate && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Reviewed
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white text-right">
                          {formatDate(returnDetail.reviewedDate)}
                        </span>
                      </div>
                    )}

                    {returnDetail.approvedDate && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Approved
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white text-right">
                          {formatDate(returnDetail.approvedDate)}
                        </span>
                      </div>
                    )}

                    {returnDetail.rejectedDate && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Rejected
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white text-right">
                          {formatDate(returnDetail.rejectedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {returnDetail.status === "rejected" &&
                returnDetail.rejectionReason && (
                  <div className="border border-red-200 dark:border-red-800 p-8 bg-red-50 dark:bg-red-900/20">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                            Rejection Reason
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {returnDetail.rejectionReason}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {showImageModal && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={() => setShowImageModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-12">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-4 max-w-4xl w-full">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Image {selectedImage + 1} of {returnDetail.images.length}
                  </p>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="h-10 w-10 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors"
                  >
                    <XCircleIcon className="h-5 w-5 text-gray-900 dark:text-white" />
                  </button>
                </div>

                <div className="aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <img
                    src={returnDetail.images[selectedImage]}
                    alt={`Return image ${selectedImage + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex justify-center gap-2">
                  {returnDetail.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-2 w-2 ${
                        selectedImage === index
                          ? "bg-gray-900 dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
