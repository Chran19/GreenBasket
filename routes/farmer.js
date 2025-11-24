const express = require("express")
const multer = require("multer")
const Joi = require("joi")
const { authenticateToken, requireFarmer } = require("../middleware/auth")
const { validate, validateQuery, schemas } = require("../utils/validation")
const { success, error, paginated } = require("../utils/response")
const Product = require("../models/Product")
const Order = require("../models/Order")
const { supabase } = require("../config/supabase")
const { uploadToSupabase } = require("../utils/fileUpload")

const router = express.Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"), false)
    }
  },
})

// Apply authentication to all farmer routes
router.use(authenticateToken)
router.use(requireFarmer)

// Get farmer profile with statistics
router.get("/profile", async (req, res) => {
  try {
    const farmerId = req.user.id

    // Get farmer profile
    const { data: farmerProfile } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("farmer_id", farmerId)
      .single()

    // Get product statistics
    const { data: products, count: totalProducts } = await supabase
      .from("products")
      .select("id, stock, is_active", { count: "exact" })
      .eq("farmer_id", farmerId)

    const activeProducts = products?.filter((p) => p.is_active).length || 0
    const lowStockProducts = products?.filter((p) => p.stock <= 10).length || 0

    // Get order statistics
    const orderStats = await Order.getOrderStats(farmerId)

    // Get recent orders
    const recentOrders = await Order.findByFarmerId(farmerId, { page: 1, limit: 5 })

    return success(
      res,
      {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          address: req.user.address,
        },
        farmerProfile,
        statistics: {
          totalProducts: totalProducts || 0,
          activeProducts,
          lowStockProducts,
          ...orderStats,
        },
        recentOrders: recentOrders.orders,
      },
      "Farmer profile retrieved successfully",
    )
  } catch (err) {
    console.error("Get farmer profile error:", err)
    return error(res, "Failed to retrieve farmer profile", 500)
  }
})

// Update farmer profile
router.put(
  "/profile",
  validate(
    Joi.object({
      farmName: Joi.string().max(200).optional(),
      farmSize: Joi.number().positive().optional(),
      farmingExperience: Joi.number().integer().min(0).optional(),
      certifications: Joi.array().items(Joi.string()).optional(),
      farmingMethods: Joi.array().items(Joi.string()).optional(),
      bio: Joi.string().max(1000).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const farmerId = req.user.id
      const updates = req.validatedData

      // Convert arrays to PostgreSQL array format
      if (updates.certifications) {
        updates.certifications = `{${updates.certifications.join(",")}}`
      }
      if (updates.farmingMethods) {
        updates.farming_methods = `{${updates.farmingMethods.join(",")}}`
        delete updates.farmingMethods
      }

      // Convert camelCase to snake_case for database
      const dbUpdates = {
        farm_name: updates.farmName,
        farm_size: updates.farmSize,
        farming_experience: updates.farmingExperience,
        certifications: updates.certifications,
        farming_methods: updates.farming_methods,
        bio: updates.bio,
        updated_at: new Date().toISOString(),
      }

      // Remove undefined values
      Object.keys(dbUpdates).forEach((key) => {
        if (dbUpdates[key] === undefined) delete dbUpdates[key]
      })

      const { data: profile, error: profileError } = await supabase
        .from("farmer_profiles")
        .upsert([{ farmer_id: farmerId, ...dbUpdates }])
        .select("*")
        .single()

      if (profileError) throw profileError

      return success(res, profile, "Farmer profile updated successfully")
    } catch (err) {
      console.error("Update farmer profile error:", err)
      return error(res, "Failed to update farmer profile", 500)
    }
  },
)

// Get all farmer's products
router.get(
  "/products",
  validateQuery(
    Joi.object({
      isActive: Joi.boolean().optional(),
      category: Joi.string().optional(),
      lowStock: Joi.boolean().optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { isActive, category, lowStock, page, limit } = req.validatedQuery
      const farmerId = req.user.id

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("farmer_id", farmerId)
        .order("created_at", { ascending: false })

      // Apply filters
      if (isActive !== undefined) query = query.eq("is_active", isActive)
      if (category) query = query.eq("category", category)
      if (lowStock) query = query.lte("stock", 10)

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: products, error: productsError, count } = await query

      if (productsError) throw productsError

      return paginated(
        res,
        products,
        {
          page,
          limit,
          total: count,
        },
        "Products retrieved successfully",
      )
    } catch (err) {
      console.error("Get farmer products error:", err)
      return error(res, "Failed to retrieve products", 500)
    }
  },
)

// Get single product details
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params
    const farmerId = req.user.id

    const product = await Product.findById(id)

    // Verify product belongs to the farmer
    if (product.farmer_id !== farmerId) {
      return error(res, "Product not found", 404)
    }

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
    console.error("Get product details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Product not found", 404)
    }
    return error(res, "Failed to retrieve product details", 500)
  }
})

// Create new product
router.post(
  "/products",
  upload.array("images", 5), // Allow up to 5 photos
  validate(
    Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(2000).optional(),
      price: schemas.price,
      stock: Joi.number().integer().min(0).required(),
      category: Joi.string().required(),
      unit: Joi.string().default("kg"),
      isOrganic: Joi.alternatives().try(
        Joi.boolean(),
        Joi.string().valid('true', 'false')
      ).default(false),
      harvestDate: Joi.date().optional(),
      expiryDate: Joi.date().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const farmerId = req.user.id
      const productData = req.validatedData
      const files = req.files

      // Upload photos to Supabase Storage
      const photoUrls = []
      if (files && files.length > 0) {
        for (const file of files) {
          const photoUrl = await uploadToSupabase(file, "products")
          photoUrls.push(photoUrl)
        }
      }

      // Convert string boolean to actual boolean
      // Handle various formats that might come from the frontend
      const isOrganic = productData.isOrganic === true || 
                       productData.isOrganic === 'true' || 
                       productData.isOrganic === 'True' || 
                       productData.isOrganic === '1' || 
                       productData.isOrganic === 1
      
      console.log('Backend received isOrganic value:', productData.isOrganic)
      console.log('Converted isOrganic to:', isOrganic)
      
      // Create product
      const product = await Product.create({
        
        farmer_id: farmerId,
        title: productData.title,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        category: productData.category,
        photos: photoUrls,
        unit: productData.unit,
        is_organic: isOrganic,
        harvest_date: productData.harvestDate,
        expiry_date: productData.expiryDate,
        is_active: true,
      })

      return success(res, product, "Product created successfully", 201)
    } catch (err) {
      console.error("Create product error:", err)
      return error(res, "Failed to create product", 500)
    }
  },
)

// Update product
router.put(
  "/products/:id",
  upload.array("images", 5),
  validate(
    Joi.object({
      title: Joi.string().min(3).max(200).optional(),
      description: Joi.string().max(2000).optional(),
      price: schemas.price.optional(),
      stock: Joi.number().integer().min(0).optional(),
      category: Joi.string().optional(),
      unit: Joi.string().optional(),
      isOrganic: Joi.boolean().optional(),
      harvestDate: Joi.date().optional(),
      expiryDate: Joi.date().optional(),
      isActive: Joi.boolean().optional(),
      removePhotos: Joi.array().items(Joi.string()).optional(), // URLs to remove
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const farmerId = req.user.id
      const updates = req.validatedData
      const files = req.files

      // Verify product belongs to farmer
      const existingProduct = await Product.findById(id)
      if (existingProduct.farmer_id !== farmerId) {
        return error(res, "Product not found", 404)
      }

      // Handle photo updates
      let photoUrls = existingProduct.photos || []

      // Remove specified photos
      if (updates.removePhotos && updates.removePhotos.length > 0) {
        photoUrls = photoUrls.filter((url) => !updates.removePhotos.includes(url))
      }

      // Add new photos
      if (files && files.length > 0) {
        for (const file of files) {
          const photoUrl = await uploadToSupabase(file, "products")
          photoUrls.push(photoUrl)
        }
      }

      // Prepare update data
      const updateData = {
        title: updates.title,
        description: updates.description,
        price: updates.price,
        stock: updates.stock,
        category: updates.category,
        unit: updates.unit,
        is_organic: updates.isOrganic,
        harvest_date: updates.harvestDate,
        expiry_date: updates.expiryDate,
        is_active: updates.isActive,
        photos: photoUrls,
      }

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) delete updateData[key]
      })

      const product = await Product.update(id, updateData)

      return success(res, product, "Product updated successfully")
    } catch (err) {
      console.error("Update product error:", err)
      return error(res, "Failed to update product", 500)
    }
  },
)

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params
    const farmerId = req.user.id

    // Verify product belongs to farmer
    const product = await Product.findById(id)
    if (product.farmer_id !== farmerId) {
      return error(res, "Product not found", 404)
    }

    // Soft delete by setting is_active to false
    await Product.update(id, { is_active: false })

    return success(res, null, "Product deleted successfully")
  } catch (err) {
    console.error("Delete product error:", err)
    return error(res, "Failed to delete product", 500)
  }
})

// Get low stock products
router.get("/inventory/low-stock", async (req, res) => {
  try {
    const farmerId = req.user.id
    const threshold = Number.parseInt(req.query.threshold) || 10

    const lowStockProducts = await Product.getLowStockProducts(farmerId, threshold)

    return success(res, lowStockProducts, "Low stock products retrieved successfully")
  } catch (err) {
    console.error("Get low stock products error:", err)
    return error(res, "Failed to retrieve low stock products", 500)
  }
})

// Update product stock
router.patch(
  "/inventory/:productId/stock",
  validate(
    Joi.object({
      stock: Joi.number().integer().min(0).required(),
    }),
  ),
  async (req, res) => {
    try {
      const { productId } = req.params
      const { stock } = req.validatedData
      const farmerId = req.user.id

      // Verify product belongs to farmer
      const product = await Product.findById(productId)
      if (product.farmer_id !== farmerId) {
        return error(res, "Product not found", 404)
      }

      const updatedProduct = await Product.updateStock(productId, stock)

      return success(res, updatedProduct, "Stock updated successfully")
    } catch (err) {
      console.error("Update stock error:", err)
      return error(res, "Failed to update stock", 500)
    }
  },
)

// Get farmer's orders
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
      const farmerId = req.user.id

      const result = await Order.findByFarmerId(farmerId, { page, limit })

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
      console.error("Get farmer orders error:", err)
      return error(res, "Failed to retrieve orders", 500)
    }
  },
)

// Update order status
router.patch(
  "/orders/:id/status",
  validate(
    Joi.object({
      status: Joi.string().valid("confirmed", "shipped", "delivered", "cancelled").required(),
      notes: Joi.string().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const { status, notes } = req.validatedData
      const farmerId = req.user.id

      // Verify order belongs to farmer
      const order = await Order.findById(id)
      if (order.farmer_id !== farmerId) {
        return error(res, "Order not found", 404)
      }

      const updatedOrder = await Order.updateStatus(id, status, notes)

      return success(res, updatedOrder, "Order status updated successfully")
    } catch (err) {
      console.error("Update order status error:", err)
      return error(res, "Failed to update order status", 500)
    }
  },
)

// Get sales analytics
router.get("/analytics/sales", async (req, res) => {
  try {
    const farmerId = req.user.id
    const { period = "month" } = req.query

    // Get order statistics
    const orderStats = await Order.getOrderStats(farmerId)

    // Get sales data by period
    let dateFilter = "created_at >= NOW() - INTERVAL '30 days'"
    if (period === "week") dateFilter = "created_at >= NOW() - INTERVAL '7 days'"
    if (period === "year") dateFilter = "created_at >= NOW() - INTERVAL '1 year'"

    const { data: salesData } = await supabase
      .from("orders")
      .select("total_price, commission_amount, status, created_at")
      .eq("farmer_id", farmerId)
      .gte(
        "created_at",
        new Date(
          Date.now() - (period === "week" ? 7 : period === "year" ? 365 : 30) * 24 * 60 * 60 * 1000,
        ).toISOString(),
      )
      .order("created_at", { ascending: true })

    // Calculate daily/weekly/monthly revenue
    const revenueByPeriod = {}
    salesData?.forEach((order) => {
      const date = new Date(order.created_at)
      let key

      if (period === "week") {
        key = date.toISOString().split("T")[0] // Daily for week view
      } else if (period === "year") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` // Monthly for year view
      } else {
        key = date.toISOString().split("T")[0] // Daily for month view
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = { revenue: 0, orders: 0, commission: 0 }
      }

      if (order.status === "delivered") {
        revenueByPeriod[key].revenue += Number.parseFloat(order.total_price)
        revenueByPeriod[key].commission += Number.parseFloat(order.commission_amount || 0)
      }
      revenueByPeriod[key].orders += 1
    })

    // Get top-selling products
    const { data: topProducts } = await supabase
      .from("order_items")
      .select(`
        product_id,
        quantity,
        total_price,
        product:products (
          id, title, photos
        ),
        order:orders!inner (
          farmer_id, status
        )
      `)
      .eq("order.farmer_id", farmerId)
      .eq("order.status", "delivered")

    const productSales = {}
    topProducts?.forEach((item) => {
      const productId = item.product_id
      if (!productSales[productId]) {
        productSales[productId] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
          orderCount: 0,
        }
      }
      productSales[productId].totalQuantity += item.quantity
      productSales[productId].totalRevenue += Number.parseFloat(item.total_price)
      productSales[productId].orderCount += 1
    })

    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)

    return success(
      res,
      {
        orderStats,
        revenueByPeriod,
        topSellingProducts,
        period,
      },
      "Sales analytics retrieved successfully",
    )
  } catch (err) {
    console.error("Get sales analytics error:", err)
    return error(res, "Failed to retrieve sales analytics", 500)
  }
})

// Get messages (conversations)
router.get(
  "/messages",
  validateQuery(
    Joi.object({
      conversationWith: schemas.id.optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const farmerId = req.user.id
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
            `and(sender_id.eq.${farmerId},receiver_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},receiver_id.eq.${farmerId})`,
          )
          .order("created_at", { ascending: false })
          .range(from, to)

        if (messagesError) throw messagesError

        // Mark messages as read
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", conversationWith)
          .eq("receiver_id", farmerId)
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
          .or(`sender_id.eq.${farmerId},receiver_id.eq.${farmerId}`)
          .order("created_at", { ascending: false })

        // Group by conversation partner
        const conversationMap = {}
        conversations?.forEach((message) => {
          const partnerId = message.sender_id === farmerId ? message.receiver_id : message.sender_id
          const partner = message.sender_id === farmerId ? message.receiver : message.sender

          if (
            !conversationMap[partnerId] ||
            new Date(message.created_at) > new Date(conversationMap[partnerId].lastMessage.created_at)
          ) {
            conversationMap[partnerId] = {
              partner,
              lastMessage: {
                content: message.content,
                created_at: message.created_at,
                isFromMe: message.sender_id === farmerId,
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
            .eq("receiver_id", farmerId)
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
  validate(
    Joi.object({
      receiverId: schemas.id,
      content: Joi.string().min(1).max(2000).required(),
      messageType: Joi.string().valid("text", "image", "file").default("text"),
    }),
  ),
  async (req, res) => {
    try {
      const farmerId = req.user.id
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
            sender_id: farmerId,
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

// Get delivery schedule
router.get("/delivery/schedule", async (req, res) => {
  try {
    const farmerId = req.user.id
    const { date } = req.query

    let query = supabase
      .from("orders")
      .select(`
        id, delivery_date, delivery_address, status, total_price,
        buyer:users!buyer_id (
          id, name, phone
        ),
        order_items (
          quantity,
          product:products (
            title, unit
          )
        )
      `)
      .eq("farmer_id", farmerId)
      .in("status", ["confirmed", "shipped"])
      .not("delivery_date", "is", null)
      .order("delivery_date", { ascending: true })

    if (date) {
      query = query.eq("delivery_date", date)
    } else {
      // Get next 7 days
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      query = query
        .gte("delivery_date", new Date().toISOString().split("T")[0])
        .lte("delivery_date", nextWeek.toISOString().split("T")[0])
    }

    const { data: deliveries, error: deliveryError } = await query

    if (deliveryError) throw deliveryError

    return success(res, deliveries, "Delivery schedule retrieved successfully")
  } catch (err) {
    console.error("Get delivery schedule error:", err)
    return error(res, "Failed to retrieve delivery schedule", 500)
  }
})

// Update delivery date
router.patch(
  "/delivery/:orderId",
  validate(
    Joi.object({
      deliveryDate: Joi.date().min("now").required(),
    }),
  ),
  async (req, res) => {
    try {
      const { orderId } = req.params
      const { deliveryDate } = req.validatedData
      const farmerId = req.user.id

      // Verify order belongs to farmer
      const order = await Order.findById(orderId)
      if (order.farmer_id !== farmerId) {
        return error(res, "Order not found", 404)
      }

      const { data: updatedOrder, error: updateError } = await supabase
        .from("orders")
        .update({
          delivery_date: deliveryDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*")
        .single()

      if (updateError) throw updateError

      return success(res, updatedOrder, "Delivery date updated successfully")
    } catch (err) {
      console.error("Update delivery date error:", err)
      return error(res, "Failed to update delivery date", 500)
    }
  },
)

module.exports = router
