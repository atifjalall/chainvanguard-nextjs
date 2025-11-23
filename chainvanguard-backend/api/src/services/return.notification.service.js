import notificationService from "./notification.service.js";

/**
 * ========================================
 * RETURN NOTIFICATION SERVICE
 * ========================================
 * Handles notifications for return workflow using main notification service
 */

class ReturnNotificationService {
  /**
   * Notify customer: Return request received
   */
  async notifyCustomerReturnReceived(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_received",
        category: "return",
        title: "Return Request Received",
        message: `Your return request ${returnRequest.returnNumber} has been received and is being reviewed by ${returnRequest.vendorName}.`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            returnAmount: returnRequest.returnAmount,
          },
        },
      });

      console.log(
        `✅ Notified customer: Return ${returnRequest.returnNumber} received`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify vendor: New return request
   */
  async notifyVendorNewReturn(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "new_return_request",
        category: "return",
        title: "New Return Request",
        message: `${returnRequest.customerName} has requested a return for order ${returnRequest.orderNumber}. Amount: CVT ${returnRequest.returnAmount}`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
            returnAmount: returnRequest.returnAmount,
          },
        },
      });

      console.log(
        `✅ Notified vendor: New return ${returnRequest.returnNumber}`
      );
    } catch (error) {
      console.error("❌ Failed to send vendor notification:", error);
    }
  }

  /**
   * Notify customer: Return approved
   */
  async notifyCustomerReturnApproved(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_approved",
        category: "return",
        title: "Return Request Approved",
        message: `Your return request ${returnRequest.returnNumber} has been approved! Refund amount: CVT ${returnRequest.refundAmount}. Please ship the item back within 14 days.`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            refundAmount: returnRequest.refundAmount,
            returnDeadline: returnRequest.returnDeadline,
          },
        },
      });

      console.log(
        `✅ Notified customer: Return ${returnRequest.returnNumber} approved`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify customer: Return rejected
   */
  async notifyCustomerReturnRejected(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_rejected",
        category: "return",
        title: "Return Request Rejected",
        message: `Your return request ${returnRequest.returnNumber} has been rejected. Reason: ${returnRequest.rejectionReason}`,
        priority: "high",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            rejectionReason: returnRequest.rejectionReason,
          },
        },
      });

      console.log(
        `✅ Notified customer: Return ${returnRequest.returnNumber} rejected`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify vendor: Item received
   */
  async notifyVendorItemReceived(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "return_item_received",
        category: "return",
        title: "Return Item Marked as Received",
        message: `Return ${returnRequest.returnNumber} has been marked as received. Please inspect the item and process accordingly.`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
          },
        },
      });

      console.log(
        `✅ Notified vendor: Item received for ${returnRequest.returnNumber}`
      );
    } catch (error) {
      console.error("❌ Failed to send vendor notification:", error);
    }
  }

  /**
   * Notify customer: Item inspected
   */
  async notifyCustomerItemInspected(returnRequest) {
    try {
      const conditionMessages = {
        good: "Your item has been inspected and is in good condition. Refund will be processed shortly.",
        damaged:
          "Your item has been inspected and shows damage. The refund amount may be adjusted.",
        unsellable:
          "Unfortunately, your item is unsellable and cannot be restocked. Refund processing may be affected.",
      };

      const message =
        conditionMessages[returnRequest.inspection.condition] ||
        "Your returned item has been inspected.";

      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_inspected",
        category: "return",
        title: "Return Item Inspected",
        message: `${message} (Return: ${returnRequest.returnNumber})`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            condition: returnRequest.inspection.condition,
            refundAmount: returnRequest.refundAmount,
          },
        },
      });

      console.log(
        `✅ Notified customer: Return ${returnRequest.returnNumber} inspected`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify customer: Refund processed
   */
  async notifyCustomerRefundProcessed(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "refund_processed",
        category: "return",
        title: "Refund Processed 💰",
        message: `Your refund of CVT ${returnRequest.refundAmount} has been processed and added to your wallet for return ${returnRequest.returnNumber}.`,
        priority: "high",
        actionType: "view_wallet",
        actionUrl: `/customer/wallet`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            refundAmount: returnRequest.refundAmount,
            refundTransactionId: returnRequest.refundTransactionId,
          },
        },
      });

      console.log(
        `✅ Notified customer: Refund processed for ${returnRequest.returnNumber}`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify vendor: Refund processed
   */
  async notifyVendorRefundProcessed(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "return_refund_completed",
        category: "return",
        title: "Return Refund Completed",
        message: `Refund of CVT ${returnRequest.refundAmount} has been processed for return ${returnRequest.returnNumber}. Return workflow completed.`,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
            refundAmount: returnRequest.refundAmount,
          },
        },
      });

      console.log(
        `✅ Notified vendor: Refund completed for ${returnRequest.returnNumber}`
      );
    } catch (error) {
      console.error("❌ Failed to send vendor notification:", error);
    }
  }

  /**
   * Notify customer: Return cancelled
   */
  async notifyCustomerReturnCancelled(returnRequest, cancelledBy) {
    try {
      const cancelledByVendor =
        cancelledBy === returnRequest.vendorId.toString();
      const message = cancelledByVendor
        ? `Your return request ${returnRequest.returnNumber} has been cancelled by ${returnRequest.vendorName}.`
        : `Your return request ${returnRequest.returnNumber} has been cancelled.`;

      await notificationService.createNotification({
        userId: returnRequest.customerId,
        userRole: "customer",
        type: "return_cancelled",
        category: "return",
        title: "Return Request Cancelled",
        message: message,
        priority: "normal",
        actionType: "view_return",
        actionUrl: `/customer/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            cancellationReason: returnRequest.cancellationReason,
          },
        },
      });

      console.log(
        `✅ Notified customer: Return ${returnRequest.returnNumber} cancelled`
      );
    } catch (error) {
      console.error("❌ Failed to send customer notification:", error);
    }
  }

  /**
   * Notify vendor: Return cancelled by customer
   */
  async notifyVendorReturnCancelled(returnRequest) {
    try {
      await notificationService.createNotification({
        userId: returnRequest.vendorId,
        userRole: "vendor",
        type: "return_cancelled_by_customer",
        category: "return",
        title: "Return Request Cancelled",
        message: `${returnRequest.customerName} has cancelled return request ${returnRequest.returnNumber}.`,
        priority: "low",
        actionType: "view_return",
        actionUrl: `/vendor/returns/${returnRequest._id}`,
        relatedEntity: {
          entityType: "return",
          entityId: returnRequest._id,
          entityData: {
            returnNumber: returnRequest.returnNumber,
            customerName: returnRequest.customerName,
            cancellationReason: returnRequest.cancellationReason,
          },
        },
      });

      console.log(
        `✅ Notified vendor: Return ${returnRequest.returnNumber} cancelled by customer`
      );
    } catch (error) {
      console.error("❌ Failed to send vendor notification:", error);
    }
  }

  /**
   * Send all notifications for a workflow step
   */
  async sendReturnNotifications(step, returnRequest, additionalData = {}) {
    switch (step) {
      case "created":
        await this.notifyCustomerReturnReceived(returnRequest);
        await this.notifyVendorNewReturn(returnRequest);
        break;

      case "approved":
        await this.notifyCustomerReturnApproved(returnRequest);
        break;

      case "rejected":
        await this.notifyCustomerReturnRejected(returnRequest);
        break;

      case "item_received":
        await this.notifyVendorItemReceived(returnRequest);
        break;

      case "inspected":
        await this.notifyCustomerItemInspected(returnRequest);
        break;

      case "refunded":
        await this.notifyCustomerRefundProcessed(returnRequest);
        await this.notifyVendorRefundProcessed(returnRequest);
        break;

      case "cancelled":
        if (
          additionalData.cancelledBy === returnRequest.customerId.toString()
        ) {
          await this.notifyVendorReturnCancelled(returnRequest);
        } else {
          await this.notifyCustomerReturnCancelled(
            returnRequest,
            additionalData.cancelledBy
          );
        }
        break;

      default:
        console.log(`No notifications configured for step: ${step}`);
    }
  }
}

export default new ReturnNotificationService();
