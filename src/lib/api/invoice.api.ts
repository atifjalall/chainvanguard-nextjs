import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const invoiceApi = {
  /**
   * Download invoice PDF by invoice ID
   */
  downloadInvoiceById: async (invoiceId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/invoices/${invoiceId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          responseType: "blob", // Important for downloading files
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Download invoice error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to download invoice",
      };
    }
  },

  /**
   * Get invoice by ID
   */
  getInvoiceById: async (invoiceId: string) => {
    try {
      const response = await axios.get(`${API_URL}/invoices/${invoiceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Get invoice error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to get invoice",
      };
    }
  },

  /**
   * Get invoices by order ID
   */
  getInvoicesByOrder: async (orderId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/invoices/order/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Get order invoices error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to get order invoices",
      };
    }
  },

  /**
   * Get invoices by vendor request ID
   */
  getInvoicesByVendorRequest: async (requestId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/invoices/vendor-request/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Get vendor request invoices error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to get vendor request invoices",
      };
    }
  },

  /**
   * Get all user invoices
   */
  getUserInvoices: async (userId: string) => {
    try {
      const response = await axios.get(
        `${API_URL}/invoices/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error("Get user invoices error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Failed to get user invoices",
      };
    }
  },

  /**
   * Helper function to trigger download in browser
   */
  triggerDownload: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
