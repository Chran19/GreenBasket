const express = require("express")
const Joi = require("joi")
const { authenticateToken, requireBuyer } = require("../middleware/auth")
const { validate, validateQuery, schemas } = require("../utils/validation")
const { success, error, paginated } = require("../utils/response")
const Product = require("../models/Product")
const Cart = require("../models/Cart")
const Order = require("../models/Order")
const { supabase } = require("../config/supabase")

const router = express.Router()

// Public product endpoints (no auth required)
// Get all products with search and filters
router.get(
  "/products",
  validateQuery(
    Joi.object({
      search: Joi.string().optional(),
      category: Joi.string().optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      isOrganic: Joi.boolean().optional(),
      inStock: Joi.boolean().optional(),
      sortBy: Joi.string().valid("price", "created_at", "title").default("created_at"),
      sortOrder: Joi.string().valid("asc", "desc").default("desc"),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const filters = req.validatedQuery
      const { page, limit, ...searchFilters } = filters
 
      const result = await Product.search(searchFilters, { page, limit })
 
      // Instruct client/proxies to cache for a short time (improves perceived performance)
      res.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60")

      return paginated(
        res,
        result.products,
        {
          page,
          limit,
          total: result.total,
        },
        "Products retrieved successfully",
      )
    } catch (err) {
      console.error("Product search error:", err)
      return error(res, "Failed to retrieve products", 500)
    }
  },
)

// Get single product details (public)
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params
 
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return error(res, "Invalid product ID format", 400)
    }
 
    const product = await Product.findById(id)
 
    // Get product reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select(`
        id, rating, comment, created_at, is_verified,
        buyer:users!buyer_id (
          id, name
        )
      `)
      .eq("product_id", id)
      .order("created_at", { ascending: false })
 
    // Calculate average rating
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0
 
    return success(
      res,
      {
        ...product,
        reviews: reviews || [],
        averageRating: Number(avgRating.toFixed(1)),
        reviewCount: reviews?.length || 0,
      },
      "Product details retrieved successfully",
    )
  } catch (err) {
    console.error("Product details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Product not found", 404)
    }
    return error(res, "Failed to retrieve product details", 500)
  }
})

// Apply authentication for all remaining buyer routes
router.use(authenticateToken)
router.use(requireBuyer)

// Authenticated routes continue below

// Get cart items
router.get("/cart", async (req, res) => {
  try {
    const cartItems = await Cart.getCartItems(req.user.id)
    const cartTotal = await Cart.getCartTotal(req.user.id)

    return success(
      res,
      {
        items: cartItems,
        summary: cartTotal,
      },
      "Cart retrieved successfully",
    )
  } catch (err) {
    console.error("Get cart error:", err)
    return error(res, "Failed to retrieve cart", 500)
  }
})

// Add item to cart
router.post(
  "/cart",
  validate(
    Joi.object({
      productId: schemas.id,
      quantity: Joi.number().integer().min(1).max(100).required(),
    }),
  ),
  async (req, res) => {
    try {
      const { productId, quantity } = req.validatedData

      // Check if product exists and has sufficient stock
      const product = await Product.findById(productId)
      if (product.stock < quantity) {
        return error(res, "Insufficient stock available", 400)
      }

      const cartItem = await Cart.addItem(req.user.id, productId, quantity)

      return success(res, cartItem, "Item added to cart successfully", 201)
    } catch (err) {
      console.error("Add to cart error:", err)
      if (err.message?.includes("No rows")) {
        return error(res, "Product not found", 404)
      }
      return error(res, "Failed to add item to cart", 500)
    }
  },
)

// Update cart item quantity
router.put(
  "/cart/:productId",
  validate(
    Joi.object({
      quantity: Joi.number().integer().min(0).max(100).required(),
    }),
  ),
  async (req, res) => {
    try {
      const { productId } = req.params
      const { quantity } = req.validatedData

      if (quantity === 0) {
        await Cart.removeItem(req.user.id, productId)
        return success(res, null, "Item removed from cart successfully")
      }

      // Check stock availability
      const product = await Product.findById(productId)
      if (product.stock < quantity) {
        return error(res, "Insufficient stock available", 400)
      }

      const cartItem = await Cart.updateQuantity(req.user.id, productId, quantity)

      return success(res, cartItem, "Cart updated successfully")
    } catch (err) {
      console.error("Update cart error:", err)
      return error(res, "Failed to update cart", 500)
    }
  },
)

// Remove item from cart
router.delete("/cart/:productId", async (req, res) => {
  try {
    const { productId } = req.params

    await Cart.removeItem(req.user.id, productId)

    return success(res, null, "Item removed from cart successfully")
  } catch (err) {
    console.error("Remove from cart error:", err)
    return error(res, "Failed to remove item from cart", 500)
  }
})

// Clear entire cart
router.delete("/cart", async (req, res) => {
  try {
    await Cart.clearCart(req.user.id)

    return success(res, null, "Cart cleared successfully")
  } catch (err) {
    console.error("Clear cart error:", err)
    return error(res, "Failed to clear cart", 500)
  }
})

// Create order (checkout)
router.post(
  "/checkout",
  validate(
    Joi.object({
      deliveryAddress: Joi.string().min(10).max(500).required(),
      deliveryDate: Joi.date().min("now").optional(),
      notes: Joi.string().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { deliveryAddress, deliveryDate, notes } = req.validatedData

      // Get cart items
      const cartItems = await Cart.getCartItems(req.user.id)
      if (cartItems.length === 0) {
        return error(res, "Cart is empty", 400)
      }

      // Group items by farmer
      const ordersByFarmer = {}
      let totalAmount = 0

      for (const item of cartItems) {
        const farmerId = item.product.farmer.id
        const itemTotal = item.quantity * Number.parseFloat(item.product.price)
        totalAmount += itemTotal

        if (!ordersByFarmer[farmerId]) {
          ordersByFarmer[farmerId] = {
            farmer: item.product.farmer,
            items: [],
            total: 0,
          }
        }

        ordersByFarmer[farmerId].items.push({
          product: item.product,
          quantity: item.quantity,
          pricePerUnit: Number.parseFloat(item.product.price),
          total: itemTotal,
        })
        ordersByFarmer[farmerId].total += itemTotal
      }

      // Create orders for each farmer
      const createdOrders = []

      for (const [farmerId, orderData] of Object.entries(ordersByFarmer)) {
        const commissionAmount = orderData.total * 0.07 // 7% platform fee

        // Create mock Razorpay order
        const mockRazorpayOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const order = await Order.create({
          buyer_id: req.user.id,
          farmer_id: farmerId,
          status: "pending",
          total_price: orderData.total,
          delivery_address: deliveryAddress,
          delivery_date: deliveryDate || null,
          payment_status: "pending",
          payment_method: "razorpay",
          razorpay_order_id: mockRazorpayOrderId,
          commission_amount: commissionAmount,
          notes: notes || null,
        })

        // Create order items
        const orderItems = orderData.items.map((item) => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price_per_unit: item.pricePerUnit,
          total_price: item.total,
        }))

        await supabase.from("order_items").insert(orderItems)

        // Update product stock
        for (const item of orderData.items) {
          const newStock = item.product.stock - item.quantity
          await Product.updateStock(item.product.id, newStock)
        }

        createdOrders.push({
          ...order,
          items: orderItems.length,
          farmer: orderData.farmer,
        })
      }

      // Clear cart after successful order creation
      await Cart.clearCart(req.user.id)

      return success(
        res,
        {
          orders: createdOrders,
          totalAmount,
          message: "Orders created successfully. Proceed with payment.",
        },
        "Checkout completed successfully",
        201,
      )
    } catch (err) {
      console.error("Checkout error:", err)
      return error(res, "Failed to process checkout", 500)
    }
  },
)

// Verify payment (mock Razorpay verification)
router.post(
  "/verify-payment",
  validate(
    Joi.object({
      orderId: schemas.id,
      razorpayPaymentId: Joi.string().required(),
      razorpaySignature: Joi.string().required(),
    }),
  ),
  async (req, res) => {
    try {
      const { orderId, razorpayPaymentId, razorpaySignature } = req.validatedData

      // Mock payment verification (in real implementation, verify with Razorpay)
      const isValidPayment = razorpaySignature.startsWith("mock_signature_")

      if (!isValidPayment) {
        return error(res, "Invalid payment signature", 400)
      }

      // Update order payment status
      const order = await Order.updatePaymentStatus(orderId, "paid", razorpayPaymentId)

      // Update order status to confirmed
      await Order.updateStatus(orderId, "confirmed")

      return success(
        res,
        {
          order,
          paymentStatus: "verified",
        },
        "Payment verified successfully",
      )
    } catch (err) {
      console.error("Payment verification error:", err)
      return error(res, "Failed to verify payment", 500)
    }
  },
)

// Get buyer's orders
router.get(
  "/orders",
  validateQuery(
    Joi.object({
      status: Joi.string().valid("pending", "confirmed", "shipped", "delivered", "cancelled").optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { status, page, limit } = req.validatedQuery

      const result = await Order.findByBuyerId(req.user.id, { page, limit })

      // Filter by status if provided
      if (status) {
        result.orders = result.orders.filter((order) => order.status === status)
        result.total = result.orders.length
      }

      return paginated(
        res,
        result.orders,
        {
          page,
          limit,
          total: result.total,
        },
        "Orders retrieved successfully",
      )
    } catch (err) {
      console.error("Get orders error:", err)
      return error(res, "Failed to retrieve orders", 500)
    }
  },
)

// Get specific order details
router.get("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params

    const order = await Order.findById(id)

    // Verify order belongs to the buyer
    if (order.buyer_id !== req.user.id) {
      return error(res, "Order not found", 404)
    }

    return success(res, order, "Order details retrieved successfully")
  } catch (err) {
    console.error("Get order details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Order not found", 404)
    }
    return error(res, "Failed to retrieve order details", 500)
  }
})

// Create subscription
router.post(
  "/subscriptions",
  validate(
    Joi.object({
      productId: schemas.id,
      quantity: Joi.number().integer().min(1).max(50).required(),
      frequency: Joi.string().valid("weekly", "biweekly", "monthly").required(),
      startDate: Joi.date().min("now").optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { productId, quantity, frequency, startDate } = req.validatedData

      // Check if product exists
      const product = await Product.findById(productId)

      // Calculate next delivery date
      const nextDeliveryDate = startDate ? new Date(startDate) : new Date()
      if (!startDate) {
        nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 7) // Default to next week
      }

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert([
          {
            buyer_id: req.user.id,
            product_id: productId,
            quantity,
            frequency,
            next_delivery_date: nextDeliveryDate.toISOString().split("T")[0],
            is_active: true,
          },
        ])
        .select(`
        *,
        product:products (
          id, title, price, photos,
          farmer:users!farmer_id (
            id, name
          )
        )
      `)
        .single()

      if (subError) throw subError

      return success(res, subscription, "Subscription created successfully", 201)
    } catch (err) {
      console.error("Create subscription error:", err)
      if (err.code === "23505") {
        // Unique constraint violation
        return error(res, "Subscription already exists for this product", 409)
      }
      return error(res, "Failed to create subscription", 500)
    }
  },
)

// Get buyer's subscriptions
router.get(
  "/subscriptions",
  validateQuery(
    Joi.object({
      isActive: Joi.boolean().optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { isActive, page, limit } = req.validatedQuery
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from("subscriptions")
        .select(
          `
        *,
        product:products (
          id, title, price, photos, stock,
          farmer:users!farmer_id (
            id, name
          )
        )
      `,
          { count: "exact" },
        )
        .eq("buyer_id", req.user.id)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (isActive !== undefined) {
        query = query.eq("is_active", isActive)
      }

      const { data: subscriptions, error: subError, count } = await query

      if (subError) throw subError

      return paginated(
        res,
        subscriptions,
        {
          page,
          limit,
          total: count,
        },
        "Subscriptions retrieved successfully",
      )
    } catch (err) {
      console.error("Get subscriptions error:", err)
      return error(res, "Failed to retrieve subscriptions", 500)
    }
  },
)

// Update subscription
router.put(
  "/subscriptions/:id",
  validate(
    Joi.object({
      quantity: Joi.number().integer().min(1).max(50).optional(),
      frequency: Joi.string().valid("weekly", "biweekly", "monthly").optional(),
      isActive: Joi.boolean().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.validatedData

      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("buyer_id", req.user.id)
        .select("*")
        .single()

      if (subError) throw subError

      return success(res, subscription, "Subscription updated successfully")
    } catch (err) {
      console.error("Update subscription error:", err)
      if (err.message?.includes("No rows")) {
        return error(res, "Subscription not found", 404)
      }
      return error(res, "Failed to update subscription", 500)
    }
  },
)

// Cancel subscription
router.delete("/subscriptions/:id", async (req, res) => {
  try {
    const { id } = req.params

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("buyer_id", req.user.id)
      .select("id, is_active")
      .single()

    if (subError) throw subError

    return success(res, subscription, "Subscription cancelled successfully")
  } catch (err) {
    console.error("Cancel subscription error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Subscription not found", 404)
    }
    return error(res, "Failed to cancel subscription", 500)
  }
})

// Create review
router.post(
  "/reviews",
  validate(
    Joi.object({
      productId: schemas.id,
      orderId: schemas.id.optional(),
      rating: schemas.rating,
      comment: Joi.string().max(1000).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { productId, orderId, rating, comment } = req.validatedData

      // Check if product exists
      await Product.findById(productId)

      // Check if buyer has purchased this product (if orderId provided)
      let isVerified = false
      if (orderId) {
        const { data: orderItem } = await supabase
          .from("order_items")
          .select(`
          id,
          order:orders!inner (
            id, buyer_id, status
          )
        `)
          .eq("product_id", productId)
          .eq("order.buyer_id", req.user.id)
          .eq("order.status", "delivered")
          .single()

        isVerified = !!orderItem
      }

      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: productId,
            buyer_id: req.user.id,
            order_id: orderId || null,
            rating,
            comment: comment || null,
            is_verified: isVerified,
          },
        ])
        .select(`
        *,
        buyer:users!buyer_id (
          id, name
        )
      `)
        .single()

      if (reviewError) throw reviewError

      return success(res, review, "Review submitted successfully", 201)
    } catch (err) {
      console.error("Create review error:", err)
      if (err.code === "23505") {
        // Unique constraint violation
        return error(res, "You have already reviewed this product", 409)
      }
      return error(res, "Failed to submit review", 500)
    }
  },
)

// Get buyer's reviews
router.get(
  "/reviews",
  validateQuery(
    Joi.object({
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { page, limit } = req.validatedQuery
      const from = (page - 1) * limit
      const to = from + limit - 1

      const {
        data: reviews,
        error: reviewError,
        count,
      } = await supabase
        .from("reviews")
        .select(
          `
        *,
        product:products (
          id, title, photos,
          farmer:users!farmer_id (
            id, name
          )
        )
      `,
          { count: "exact" },
        )
        .eq("buyer_id", req.user.id)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (reviewError) throw reviewError

      return paginated(
        res,
        reviews,
        {
          page,
          limit,
          total: count,
        },
        "Reviews retrieved successfully",
      )
    } catch (err) {
      console.error("Get reviews error:", err)
      return error(res, "Failed to retrieve reviews", 500)
    }
  },
)

// Update review
router.put(
  "/reviews/:id",
  validate(
    Joi.object({
      rating: schemas.rating.optional(),
      comment: Joi.string().max(1000).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const updates = req.validatedData

      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("buyer_id", req.user.id)
        .select("*")
        .single()

      if (reviewError) throw reviewError

      return success(res, review, "Review updated successfully")
    } catch (err) {
      console.error("Update review error:", err)
      if (err.message?.includes("No rows")) {
        return error(res, "Review not found", 404)
      }
      return error(res, "Failed to update review", 500)
    }
  },
)

// Delete review
router.delete("/reviews/:id", async (req, res) => {
  try {
    const { id } = req.params

    const { error: reviewError } = await supabase.from("reviews").delete().eq("id", id).eq("buyer_id", req.user.id)

    if (reviewError) throw reviewError

    return success(res, null, "Review deleted successfully")
  } catch (err) {
    console.error("Delete review error:", err)
    return error(res, "Failed to delete review", 500)
  }
})

// Get messages (conversations)
router.get(
  "/messages",
  authenticateToken,
  requireBuyer,
  validateQuery(
    Joi.object({
      conversationWith: schemas.id.optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const buyerId = req.user.id
      const { conversationWith, page, limit } = req.validatedQuery

      if (conversationWith) {
        // Get specific conversation
        const from = (page - 1) * limit
        const to = from + limit - 1

        const {
          data: messages,
          error: messagesError,
          count,
        } = await supabase
          .from("messages")
          .select(
            `
            *,
            sender:users!sender_id (
              id, name
            ),
            receiver:users!receiver_id (
              id, name
            )
          `,
            { count: "exact" },
          )
          .or(
            `and(sender_id.eq.${buyerId},receiver_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},receiver_id.eq.${buyerId})`,
          )
          .order("created_at", { ascending: false })
          .range(from, to)

        if (messagesError) throw messagesError

        // Mark messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", conversationWith)
          .eq("receiver_id", buyerId)
          .eq("is_read", false)

        return paginated(
          res,
          messages.reverse(), // Reverse to show oldest first
          {
            page,
            limit,
            total: count,
          },
          "Messages retrieved successfully",
        )
      } else {
        // Get all conversations
        const { data: conversations } = await supabase
          .from("messages")
          .select(`
            sender_id,
            receiver_id,
            content,
            created_at,
            is_read,
            sender:users!sender_id (
              id, name
            ),
            receiver:users!receiver_id (
              id, name
            )
          `)
          .or(`sender_id.eq.${buyerId},receiver_id.eq.${buyerId}`)
          .order("created_at", { ascending: false })

        // Group by conversation partner
        const conversationMap = {}
        conversations?.forEach((message) => {
          const partnerId = message.sender_id === buyerId ? message.receiver_id : message.sender_id
          const partner = message.sender_id === buyerId ? message.receiver : message.sender

          if (
            !conversationMap[partnerId] ||
            new Date(message.created_at) > new Date(conversationMap[partnerId].lastMessage.created_at)
          ) {
            conversationMap[partnerId] = {
              partner,
              lastMessage: {
                content: message.content,
                created_at: message.created_at,
                isFromMe: message.sender_id === buyerId,
              },
              unreadCount: 0,
            }
          }
        })

        // Count unread messages for each conversation
        for (const partnerId of Object.keys(conversationMap)) {
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact" })
            .eq("sender_id", partnerId)
            .eq("receiver_id", buyerId)
            .eq("is_read", false)

          conversationMap[partnerId].unreadCount = count || 0
        }

        return success(res, Object.values(conversationMap), "Conversations retrieved successfully")
      }
    } catch (err) {
      console.error("Get messages error:", err)
      return error(res, "Failed to retrieve messages", 500)
    }
  },
)

// Send message
router.post(
  "/messages",
  authenticateToken,
  requireBuyer,
  validate(
    Joi.object({
      receiverId: schemas.id,
      content: Joi.string().min(1).max(2000).required(),
      messageType: Joi.string().valid("text", "image", "file").default("text"),
    }),
  ),
  async (req, res) => {
    try {
      const buyerId = req.user.id
      const { receiverId, content, messageType } = req.validatedData

      // Verify receiver exists
      const { data: receiver } = await supabase.from("users").select("id, role").eq("id", receiverId).single()

      if (!receiver) {
        return error(res, "Invalid receiver", 400)
      }

      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            sender_id: buyerId,
            receiver_id: receiverId,
            content,
            message_type: messageType,
            is_read: false,
          },
        ])
        .select(`
          *,
          sender:users!sender_id (
            id, name
          ),
          receiver:users!receiver_id (
            id, name
          )
        `)
        .single()

      if (messageError) throw messageError

      return success(res, message, "Message sent successfully", 201)
    } catch (err) {
      console.error("Send message error:", err)
      return error(res, "Failed to send message", 500)
    }
  },
)

// Get buyer profile with order statistics
router.get("/profile", async (req, res) => {
  try {
    const user = req.user

    // Get order statistics
    const orderStats = await Order.getOrderStats(null, user.id)

    // Get recent orders
    const recentOrders = await Order.findByBuyerId(user.id, { page: 1, limit: 5 })

    // Get active subscriptions count
    const { count: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact" })
      .eq("buyer_id", user.id)
      .eq("is_active", true)

    return success(
      res,
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
        },
        statistics: {
          ...orderStats,
          activeSubscriptions: activeSubscriptions || 0,
        },
        recentOrders: recentOrders.orders,
      },
      "Profile retrieved successfully",
    )
  } catch (err) {
    console.error("Get profile error:", err)
    return error(res, "Failed to retrieve profile", 500)
  }
})

module.exports = router
