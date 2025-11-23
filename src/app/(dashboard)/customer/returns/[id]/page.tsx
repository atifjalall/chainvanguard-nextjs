/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

import { usePageTitle } from "@/hooks/use-page-title";
import {
  getReturnById,
  type ReturnRequest,
} from "@/lib/api/customer.returns.api";

export default function ReturnDetailPage() {
  usePageTitle("Return Details");
  const router = useRouter();
  const params = useParams();
  const returnId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [returnDetail, setReturnDetail] = useState<ReturnRequest | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (returnId) {
      loadReturnDetails();
    }
  }, [returnId]);

  const loadReturnDetails = async () => {
    try {
      setLoading(true);
      const response = await getReturnById(returnId);

      if (response.success && response.return) {
        setReturnDetail(response.return);
      } else {
        toast.error("Failed to load return details");
        router.push("/customer/returns");
      }
    } catch (error: any) {
      console.error("Error loading return:", error);
      toast.error(error.message || "Failed to load return details");
      router.push("/customer/returns");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Pending";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        );
      case "requested":
        return (
          <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        );
      case "rejected":
        return (
          <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        );
      case "refunded":
        return (
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        );
      default:
        return (
          <ClockIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "refunded":
        return "text-green-600 dark:text-green-400";
      case "requested":
        return "text-yellow-600 dark:text-yellow-400";
      case "rejected":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "approved":
      case "refunded":
        return "bg-green-50 dark:bg-green-900/20";
      case "requested":
        return "bg-yellow-50 dark:bg-yellow-900/20";
      case "rejected":
        return "bg-red-50 dark:bg-red-900/20";
      default:
        return "bg-gray-50 dark:bg-gray-900";
    }
  };

  // Create timeline from status history
  const getTimeline = () => {
    if (!returnDetail?.statusHistory) return [];

    return returnDetail.statusHistory.map((history, index) => ({
      status: history.status,
      label:
        history.status.charAt(0).toUpperCase() +
        history.status.slice(1).replace(/_/g, " "),
      description:
        history.notes || `Return ${history.status.replace(/_/g, " ")}`,
      timestamp: history.timestamp,
      completed: true,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading return details...
          </p>
        </div>
      </div>
    );
  }

  if (!returnDetail) {
    return null;
  }

  const timeline = getTimeline();

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
              onClick={() => router.push("/customer/returns")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Returns
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {returnDetail.returnNumber}
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
                {getStatusIcon(returnDetail.status)}
                <div>
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    {returnDetail.returnNumber}
                  </h1>
                  <p
                    className={`text-sm uppercase tracking-[0.2em] ${getStatusColor(
                      returnDetail.status
                    )}`}
                  >
                    {returnDetail.status.replace(/_/g, " ")}
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
              {/* Return Items */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Return Items
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
                  {returnDetail.items.map((item, index) => (
                    <div key={index} className="p-8">
                      <div className="flex items-start gap-6">
                        <div className="h-24 w-24 bg-gray-100 dark:bg-gray-900 flex-shrink-0 flex items-center justify-center">
                          <CubeIcon className="h-8 w-8 text-gray-400" />
                        </div>

                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-lg font-normal text-gray-900 dark:text-white mb-2">
                              {item.productName || "Product"}
                            </h3>
                          </div>

                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                                Price
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                CVT {(item.price || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                                Quantity
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {item.quantity}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-1">
                                Subtotal
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white">
                                CVT {(item.subtotal || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                      <p className="text-sm text-gray-900 dark:text-white capitalize">
                        {returnDetail.reason.replace(/_/g, " ")}
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Description
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {returnDetail.reasonDetails}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Images */}
              {returnDetail.images && returnDetail.images.length > 0 && (
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`Return image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <div>
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                    Return Timeline
                  </h2>

                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="space-y-8">
                      {timeline.map((step, index) => (
                        <div key={index} className="flex items-start gap-6">
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
                            {index !== timeline.length - 1 && (
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
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Status Card */}
              <div
                className={`border border-gray-200 dark:border-gray-800 p-8 ${getStatusBgColor(
                  returnDetail.status
                )}`}
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    {getStatusIcon(returnDetail.status)}
                  </div>

                  <div>
                    <p
                      className={`text-lg font-medium uppercase tracking-[0.2em] ${getStatusColor(
                        returnDetail.status
                      )}`}
                    >
                      {returnDetail.status.replace(/_/g, " ")}
                    </p>
                  </div>

                  {returnDetail.status === "approved" && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <p className="text-xs text-gray-900 dark:text-white">
                        Please ship the item back to proceed with the refund.
                      </p>
                      {returnDetail.returnDeadline && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Deadline: {formatDate(returnDetail.returnDeadline)}
                        </p>
                      )}
                    </div>
                  )}

                  {returnDetail.status === "refunded" && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        Refund Completed
                      </p>
                      <p className="text-2xl font-light text-green-600 dark:text-green-400">
                        CVT {returnDetail.refundAmount.toFixed(2)}
                      </p>
                      {returnDetail.refundedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Processed on {formatDate(returnDetail.refundedAt)}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        The refund has been added to your wallet.
                      </p>
                    </div>
                  )}

                  {returnDetail.status === "rejected" && (
                    <div className="pt-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        Return Rejected
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Your return request was not approved. No refund will be processed.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Refund Information */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Refund Information
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Return Amount
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        CVT {returnDetail.returnAmount.toFixed(2)}
                      </span>
                    </div>

                    {returnDetail.restockingFee > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Restocking Fee
                        </span>
                        <span className="text-sm text-red-600 dark:text-red-400">
                          -CVT {returnDetail.restockingFee.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {returnDetail.shippingRefund > 0 && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Shipping Refund
                        </span>
                        <span className="text-sm text-green-600 dark:text-green-400">
                          +CVT {returnDetail.shippingRefund.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          Refund Amount
                        </span>
                        <span className="text-lg font-light text-gray-900 dark:text-white">
                          CVT {returnDetail.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {returnDetail.status === "refunded" &&
                      returnDetail.refundedAt && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                          <p className="text-xs text-green-600 dark:text-green-400">
                            ✓ Refunded on {formatDate(returnDetail.refundedAt)}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {/* Order Reference */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Order Reference
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Order Number
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {returnDetail.orderNumber}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              returnDetail.orderNumber,
                              "Order number"
                            )
                          }
                          className="flex-shrink-0"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/customer/orders/${returnDetail.orderId}`)
                      }
                      className="w-full border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors"
                    >
                      View Order
                    </button>
                  </div>
                </div>
              </div>

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
                        {formatDate(returnDetail.createdAt)}
                      </span>
                    </div>

                    {returnDetail.reviewedAt && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Reviewed
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white text-right">
                          {formatDate(returnDetail.reviewedAt)}
                        </span>
                      </div>
                    )}

                    {returnDetail.refundedAt && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Refunded
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white text-right">
                          {formatDate(returnDetail.refundedAt)}
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
      {showImageModal &&
        returnDetail.images &&
        returnDetail.images.length > 0 && (
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
