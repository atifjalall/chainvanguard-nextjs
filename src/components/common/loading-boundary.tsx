"use client";

import React, { Suspense } from "react";
import { PageLoader, SectionLoader } from "./loader";

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  type?: "page" | "section";
}

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  children,
  fallback,
  type = "section",
}) => {
  const defaultFallback = type === "page" ? <PageLoader /> : <SectionLoader />;

  return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>;
};
