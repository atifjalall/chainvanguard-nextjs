import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArchiveBoxIcon,
  EyeIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  pricePerUnit: string;
  quantity: string;
  unit: string;
  images: string[];
  textileDetails: {
    color: string;
    fabricType: string;
  };
}

interface InventoryCardProps {
  item: InventoryItem;
  onViewDetails?: (id: string) => void;
  onRequest?: (id: string) => void;
}

const InventoryCard: React.FC<InventoryCardProps> = ({
  item,
  onViewDetails,
  onRequest,
}) => {
  const getStockStatus = () => {
    const qty = parseInt(item.quantity);
    if (qty === 0) return { label: "Out of Stock", color: "red" };
    if (qty < 20) return { label: "Low Stock", color: "yellow" };
    return { label: "In Stock", color: "green" };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300 rounded-none overflow-hidden w-full max-w-sm p-0">
      {/* Image Section - Starts from absolute top edge with NO padding */}
      <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden m-0">
        {item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <ArchiveBoxIcon className="h-16 w-16" />
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={`
              ${stockStatus.color === "green" ? "bg-green-100/10 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400" : ""}
              ${stockStatus.color === "yellow" ? "bg-yellow-100/10 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400" : ""}
              ${stockStatus.color === "red" ? "bg-red-100/10 dark:bg-red-900/10 border-red-100 dark:border-red-900 text-red-700 dark:text-red-400" : ""}
              border text-xs rounded-none backdrop-blur-sm
            `}
          >
            {stockStatus.label}
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none backdrop-blur-sm">
            {item.category}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2.5">
        {/* Name and SKU */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5 line-clamp-2 leading-tight">
            {item.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            SKU: {item.id || "N/A"}
          </p>
        </div>

        {/* Price Section */}
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Unit Price
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              ${parseFloat(item.pricePerUnit || "0").toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Available Quantity
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {item.quantity} {item.unit}
            </span>
          </div>
        </div>

        {/* Textile Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
              Color
            </p>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {item.textileDetails?.color || "N/A"}
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
              Fabric Type
            </p>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {item.textileDetails?.fabricType || "N/A"}
            </p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {item.description || "No description available"}
          </p>
        </div>

        {/* Total Value */}
        <div className="bg-gray-900 dark:bg-white p-2 rounded-none">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-400 dark:text-gray-600">
              Total Inventory Value
            </span>
            <span className="text-sm font-bold text-white dark:text-gray-900">
              $
              {(
                parseFloat(item.pricePerUnit || "0") *
                parseInt(item.quantity || "0")
              ).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {onRequest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRequest(item.id)}
              className="w-full text-xs font-medium cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all"
            >
              <ShoppingCartIcon className="h-4 w-4 mr-1.5" />
              Request
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(item.id)}
              className="w-full text-xs font-medium cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-gray-900 transition-all"
            >
              <EyeIcon className="h-4 w-4 mr-1.5" />
              View
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryCard;

// Preview Mode Component
const PreviewModeComponent: React.FC = () => {
  const [previewMode, setPreviewMode] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState<InventoryItem>({
    id: "preview",
    name: "Sample Textile Product",
    description:
      "High-quality fabric material suitable for various applications",
    category: "Textiles",
    pricePerUnit: "25.50",
    quantity: "150",
    unit: "pieces",
    images: [],
    textileDetails: {
      color: "Blue",
      fabricType: "Cotton",
    },
  });

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleRequest = (id: string) => {
    alert(`Request initiated for item: ${id}`);
  };

  const handleViewDetails = (id: string) => {
    alert(`Viewing details for item: ${id}`);
  };

  if (previewMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2 text-xs cursor-pointer h-8 rounded-none"
                size="sm"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                Back to Edit
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Inventory Item Preview
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                  Preview how your inventory item will appear in the list
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="sm"
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <CheckCircleIcon className="h-3 w-3 mr-2" />
              )}
              {isLoading ? "Adding..." : "Add to Inventory"}
            </Button>
          </div>

          <div className="flex justify-center">
            <InventoryCard
              item={formData}
              onRequest={handleRequest}
              onViewDetails={handleViewDetails}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Inventory Item Preview
      </h1>
      <p className="text-base text-gray-600 dark:text-gray-400 mt-1 mb-4">
        Preview how your inventory item will appear in the list
      </p>
      <Button
        variant="outline"
        onClick={() => setPreviewMode(true)}
        className="flex items-center gap-2 text-xs cursor-pointer h-8 rounded-none"
        size="sm"
      >
        <EyeIcon className="h-3 w-3" />
        Enter Preview Mode
      </Button>
    </div>
  );
};
