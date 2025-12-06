import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class StripeService {
  /**
   * Create a Payment Intent for adding funds
   * @param {number} amount - Amount in USD
   * @param {string} userId - User ID
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Payment intent details
   */
  async createPaymentIntent(amount, userId, metadata = {}) {
    try {
      if (!amount || amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      // Stripe expects amount in cents
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          type: "wallet_deposit",
          amountUSD: amount.toString(),
          ...metadata,
        },
        description: `Wallet deposit - $${amount.toFixed(2)} USD`,
      });

      console.log(`✅ Payment intent created: ${paymentIntent.id}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        amountInCents: amountInCents,
      };
    } catch (error) {
      console.error("❌ Create payment intent failed:", error);
      throw new Error(
        error.message || "Failed to create Stripe payment intent"
      );
    }
  }

  /**
   * Confirm and verify a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Promise<object>} - Payment verification result
   */
  async verifyPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status === "succeeded") {
        return {
          success: true,
          verified: true,
          amount: paymentIntent.amount / 100, // Convert cents to dollars
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method,
          metadata: paymentIntent.metadata,
        };
      }

      return {
        success: false,
        verified: false,
        status: paymentIntent.status,
        message: `Payment status: ${paymentIntent.status}`,
      };
    } catch (error) {
      console.error("❌ Verify payment failed:", error);
      throw new Error(error.message || "Failed to verify payment");
    }
  }

  /**
   * Process refund for a payment
   * @param {string} paymentIntentId - Payment intent ID
   * @param {number} amount - Amount to refund (optional, defaults to full refund)
   * @returns {Promise<object>} - Refund details
   */
  async processRefund(paymentIntentId, amount = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);

      console.log(`✅ Refund processed: ${refund.id}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      console.error("❌ Process refund failed:", error);
      throw new Error(error.message || "Failed to process refund");
    }
  }

  /**
   * Get payment method details
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<object>} - Payment method details
   */
  async getPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentMethodId
      );

      return {
        success: true,
        type: paymentMethod.type,
        card: paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              expMonth: paymentMethod.card.exp_month,
              expYear: paymentMethod.card.exp_year,
            }
          : null,
      };
    } catch (error) {
      console.error("❌ Get payment method failed:", error);
      throw new Error(error.message || "Failed to get payment method details");
    }
  }

  /**
   * Create a customer in Stripe
   * @param {string} email - Customer email
   * @param {string} name - Customer name
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} - Customer details
   */
  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });

      console.log(`✅ Stripe customer created: ${customer.id}`);

      return {
        success: true,
        customerId: customer.id,
        email: customer.email,
        name: customer.name,
      };
    } catch (error) {
      console.error("❌ Create customer failed:", error);
      throw new Error(error.message || "Failed to create Stripe customer");
    }
  }

  /**
   * Retrieve webhook event
   * @param {string} payload - Request body
   * @param {string} signature - Stripe signature header
   * @returns {Promise<object>} - Webhook event
   */
  async constructWebhookEvent(payload, signature) {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        throw new Error("Stripe webhook secret not configured");
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return event;
    } catch (error) {
      console.error("❌ Webhook verification failed:", error);
      throw new Error(error.message || "Failed to verify webhook");
    }
  }
}

export default new StripeService();
