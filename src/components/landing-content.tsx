"use client";

import { useState, useEffect, ReactNode } from "react";
import { LandingSkeleton } from "./landing-skeleton";

export function LandingContent({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LandingSkeleton />;
  }

  return <>{children}</>;
}
