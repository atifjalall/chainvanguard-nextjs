"use client";

import { useEffect } from "react";

/**
 * Custom hook to set the page title dynamically
 * @param title - The page-specific title (will be appended with "| ChainVanguard")
 * @example
 * usePageTitle("My Orders"); // Results in "My Orders | ChainVanguard"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} - ChainVanguard` : "ChainVanguard - Blockchain Supply Chain Management";

    // Cleanup function to restore previous title (optional)
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
