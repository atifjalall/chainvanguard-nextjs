"use client";

import React from "react";
import CubeLoader from "./cube-loader";

// Main Loader component - use this throughout the project
export const Loader: React.FC<{ fullScreen?: boolean }> = ({
  fullScreen = true,
}) => {
  if (!fullScreen) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="relative">
          <CubeLoader />
        </div>
      </div>
    );
  }

  return <CubeLoader />;
};

// For page-level loading (use in page components)
export const PageLoader: React.FC = () => {
  return <CubeLoader />;
};

// For section/card loading
export const SectionLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-20 min-h-[300px]">
      <div className="relative">
        <CubeLoader />
      </div>
    </div>
  );
};

// For inline/small loading states (buttons, forms, etc)
export const InlineLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
};

// For button loading states
export const ButtonLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    </div>
  );
};

// For table/list row loading
export const RowLoader: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
};

export default Loader;
