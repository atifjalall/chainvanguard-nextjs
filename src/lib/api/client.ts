/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    // Check both possible token keys
    return (
      localStorage.getItem("chainvanguard_auth_token") ||
      localStorage.getItem("token")
    );
  }

  private setToken(token: string): void {
    if (typeof window === "undefined") return;
    // Store in both keys for compatibility
    localStorage.setItem("token", token);
    localStorage.setItem("chainvanguard_auth_token", token);
  }

  private clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("chainvanguard_auth_token");
    localStorage.removeItem("chainvanguard_auth_user");
    localStorage.removeItem("chainvanguard_user");
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as any;
      const message = data?.message || data?.error || "An error occurred";
      const apiError = new Error(message);
      (apiError as any).response = error.response;
      return apiError;
    } else if (error.request) {
      // Request made but no response
      return new Error(
        "No response from server. Please check your connection."
      );
    } else {
      // Error in request setup
      return new Error(error.message || "An error occurred");
    }
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  saveAuthData(token: string, user: any): void {
    this.setToken(token);
    if (typeof window !== "undefined") {
      localStorage.setItem("chainvanguard_auth_user", JSON.stringify(user));
      localStorage.setItem("chainvanguard_user", JSON.stringify(user));
    }
  }

  clearAuthData(): void {
    this.clearToken();
  }

  getAuthUser(): any {
    if (typeof window === "undefined") return null;

    // Check both possible user keys
    const userStr =
      localStorage.getItem("chainvanguard_auth_user") ||
      localStorage.getItem("chainvanguard_user");

    if (!userStr) {
      console.warn("[API Client] No user data found in localStorage");
      return null;
    }

    try {
      const user = JSON.parse(userStr);
      console.log(
        "[API Client] Found user:",
        user.email,
        "ID:",
        user._id || user.id
      );
      return user;
    } catch (error) {
      console.error("[API Client] Error parsing user data:", error);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getAuthUser();
  }
}

export const apiClient = new ApiClient();
