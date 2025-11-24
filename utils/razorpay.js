// Mock Razorpay integration for development
class MockRazorpay {
  constructor(options) {
    this.keyId = options.key_id
    this.keySecret = options.key_secret
  }

  // Mock order creation
  orders = {
    create: async (orderData) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 100))

      return {
        id: `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        entity: "order",
        amount: orderData.amount,
        amount_paid: 0,
        amount_due: orderData.amount,
        currency: orderData.currency || "INR",
        receipt: orderData.receipt,
        status: "created",
        attempts: 0,
        notes: orderData.notes || {},
        created_at: Math.floor(Date.now() / 1000),
      }
    },

    fetch: async (orderId) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        id: orderId,
        entity: "order",
        amount: 50000, // Mock amount
        amount_paid: 0,
        amount_due: 50000,
        currency: "INR",
        receipt: "receipt_mock",
        status: "created",
        attempts: 0,
        notes: {},
        created_at: Math.floor(Date.now() / 1000),
      }
    },
  }

  // Mock payment verification
  payments = {
    fetch: async (paymentId) => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return {
        id: paymentId,
        entity: "payment",
        amount: 50000,
        currency: "INR",
        status: "captured",
        order_id: `order_mock_${Date.now()}`,
        method: "card",
        captured: true,
        created_at: Math.floor(Date.now() / 1000),
      }
    },
  }

  // Mock signature verification
  static validateWebhookSignature(body, signature, secret) {
    // In real implementation, use crypto to verify signature
    // For mock, just check if signature starts with expected prefix
    return signature.startsWith("mock_signature_")
  }
}

// Export mock instance
const razorpay = new MockRazorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "mock_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mock_key_secret",
})

module.exports = { razorpay, MockRazorpay }
