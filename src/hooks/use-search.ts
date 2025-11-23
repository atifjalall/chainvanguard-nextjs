import { useState, useEffect, useCallback, useRef } from "react";
import { browseProducts } from "@/lib/api/customer.browse.api";
import { Product } from "@/types";

interface UseSearchOptions {
  debounceMs?: number;
  minChars?: number;
  limit?: number;
}

interface SearchResult {
  query: string;
  suggestions: Product[];
  loading: boolean;
  error: string | null;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const { debounceMs = 300, minChars = 2, limit = 8 } = options;

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = useCallback(
    async (searchQuery: string) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (searchQuery.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        const response = await browseProducts({
          search: searchQuery,
          limit: limit,
          page: 1,
        });

        setSuggestions(response.products || []);
      } catch (err) {
        // Don't set error if request was aborted (user is still typing)
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Search error:", err);
          setError("Failed to fetch search results");
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [minChars, limit]
  );

  // Debounced search effect
  useEffect(() => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear suggestions if query is too short
    if (query.length < minChars) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, minChars, fetchSuggestions]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    clearSearch,
  } as const;
};
