const express = require("express")
const Joi = require("joi")
const { authenticateToken, requireAdmin } = require("../middleware/auth")
const { validate, validateQuery, schemas } = require("../utils/validation")
const { success, error, paginated } = require("../utils/response")
const User = require("../models/User")
const Product = require("../models/Product")
const Order = require("../models/Order")
const { supabase } = require("../config/supabase")
const { generateCSVReport, generateExcelReport } = require("../utils/reports")

const router = express.Router()

// Apply authentication to all admin routes
router.use(authenticateToken)
router.use(requireAdmin)

// Get admin dashboard overview
router.get("/dashboard", async (req, res) => {
  try {
    // Get user statistics
    const { data: userStats } = await supabase.from("users").select("role, is_active, created_at").neq("role", "admin")

    const totalUsers = userStats?.length || 0
    const activeUsers = userStats?.filter((u) => u.is_active).length || 0
    const farmers = userStats?.filter((u) => u.role === "farmer").length || 0
    const buyers = userStats?.filter((u) => u.role === "buyer").length || 0

    // Get product statistics
    const { data: productStats } = await supabase.from("products").select("is_active, created_at")

    const totalProducts = productStats?.length || 0
    const activeProducts = productStats?.filter((p) => p.is_active).length || 0

    // Get order statistics
    const { data: orderStats } = await supabase
      .from("orders")
      .select("status, total_price, commission_amount, created_at")

    const totalOrders = orderStats?.length || 0
    const totalRevenue = orderStats?.reduce((sum, o) => sum + Number.parseFloat(o.total_price || 0), 0) || 0
    const totalCommission = orderStats?.reduce((sum, o) => sum + Number.parseFloat(o.commission_amount || 0), 0) || 0

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const newUsersThisMonth = userStats?.filter((u) => u.created_at >= thirtyDaysAgo).length || 0
    const newProductsThisMonth = productStats?.filter((p) => p.created_at >= thirtyDaysAgo).length || 0
    const ordersThisMonth = orderStats?.filter((o) => o.created_at >= thirtyDaysAgo).length || 0

    // Get pending disputes
    const { count: pendingDisputes } = await supabase
      .from("disputes")
      .select("id", { count: "exact" })
      .in("status", ["open", "in_progress"])

    return success(
      res,
      {
        userStats: {
          total: totalUsers,
          active: activeUsers,
          farmers,
          buyers,
          newThisMonth: newUsersThisMonth,
        },
        productStats: {
          total: totalProducts,
          active: activeProducts,
          newThisMonth: newProductsThisMonth,
        },
        orderStats: {
          total: totalOrders,
          thisMonth: ordersThisMonth,
          totalRevenue,
          totalCommission,
        },
        pendingDisputes: pendingDisputes || 0,
      },
      "Dashboard data retrieved successfully",
    )
  } catch (err) {
    console.error("Get dashboard error:", err)
    return error(res, "Failed to retrieve dashboard data", 500)
  }
})

// Get all users with filtering and pagination
router.get(
  "/users",
  validateQuery(
    Joi.object({
      role: Joi.string().valid("buyer", "farmer").optional(),
      isActive: Joi.boolean().optional(),
      search: Joi.string().optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { role, isActive, search, page, limit } = req.validatedQuery

      const result = await User.getAllUsers({ role, is_active: isActive, search }, { page, limit })

      return paginated(
        res,
        result.users,
        {
          page,
          limit,
          total: result.total,
        },
        "Users retrieved successfully",
      )
    } catch (err) {
      console.error("Get users error:", err)
      return error(res, "Failed to retrieve users", 500)
    }
  },
)

// Get specific user details
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)

    // Get user statistics
    let userStats = {}

    if (user.role === "farmer") {
      // Get farmer statistics
      const { data: products, count: totalProducts } = await supabase
        .from("products")
        .select("id, is_active", { count: "exact" })
        .eq("farmer_id", id)

      const { data: orders } = await supabase
        .from("orders")
        .select("total_price, commission_amount, status")
        .eq("farmer_id", id)

      const totalRevenue = orders?.reduce((sum, o) => sum + Number.parseFloat(o.total_price || 0), 0) || 0
      const totalCommission = orders?.reduce((sum, o) => sum + Number.parseFloat(o.commission_amount || 0), 0) || 0

      userStats = {
        totalProducts: totalProducts || 0,
        activeProducts: products?.filter((p) => p.is_active).length || 0,
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalCommission,
      }
    } else if (user.role === "buyer") {
      // Get buyer statistics
      const { data: orders } = await supabase.from("orders").select("total_price, status").eq("buyer_id", id)

      const { count: totalReviews } = await supabase.from("reviews").select("id", { count: "exact" }).eq("buyer_id", id)

      userStats = {
        totalOrders: orders?.length || 0,
        totalSpent: orders?.reduce((sum, o) => sum + Number.parseFloat(o.total_price || 0), 0) || 0,
        totalReviews: totalReviews || 0,
      }
    }

    return success(
      res,
      {
        user,
        statistics: userStats,
      },
      "User details retrieved successfully",
    )
  } catch (err) {
    console.error("Get user details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "User not found", 404)
    }
    return error(res, "Failed to retrieve user details", 500)
  }
})

// Toggle user active status
router.patch(
  "/users/:id/status",
  validate(
    Joi.object({
      isActive: Joi.boolean().required(),
      reason: Joi.string().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const { isActive, reason } = req.validatedData

      const user = await User.toggleUserStatus(id, isActive)

      // Log the action
      await supabase.from("admin_actions").insert([
        {
          admin_id: req.user.id,
          action_type: isActive ? "activate_user" : "suspend_user",
          target_id: id,
          reason: reason || null,
          created_at: new Date().toISOString(),
        },
      ])

      return success(res, user, `User ${isActive ? "activated" : "suspended"} successfully`)
    } catch (err) {
      console.error("Toggle user status error:", err)
      return error(res, "Failed to update user status", 500)
    }
  },
)

// Get platform analytics
router.get("/analytics", async (req, res) => {
  try {
    const { period = "month", type = "overview" } = req.query

    // Calculate date range
    let dateFilter
    let groupBy
    const now = new Date()

    switch (period) {
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        groupBy = "day"
        break
      case "year":
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        groupBy = "month"
        break
      default: // month
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
        groupBy = "day"
    }

    if (type === "sales") {
      // Sales analytics
      const { data: salesData } = await supabase
        .from("orders")
        .select("total_price, commission_amount, status, created_at, farmer_id")
        .gte("created_at", dateFilter)
        .order("created_at", { ascending: true })

      // Group sales by period
      const salesByPeriod = {}
      const commissionByPeriod = {}

      salesData?.forEach((order) => {
        const date = new Date(order.created_at)
        let key

        if (groupBy === "day") {
          key = date.toISOString().split("T")[0]
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        }

        if (!salesByPeriod[key]) {
          salesByPeriod[key] = 0
          commissionByPeriod[key] = 0
        }

        if (order.status === "delivered") {
          salesByPeriod[key] += Number.parseFloat(order.total_price)
          commissionByPeriod[key] += Number.parseFloat(order.commission_amount || 0)
        }
      })

      // Get top farmers by revenue
      const farmerRevenue = {}
      salesData?.forEach((order) => {
        if (order.status === "delivered") {
          if (!farmerRevenue[order.farmer_id]) {
            farmerRevenue[order.farmer_id] = 0
          }
          farmerRevenue[order.farmer_id] += Number.parseFloat(order.total_price)
        }
      })

      const topFarmerIds = Object.entries(farmerRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([id]) => id)

      const { data: topFarmers } = await supabase.from("users").select("id, name, email").in("id", topFarmerIds)

      const topFarmersWithRevenue = topFarmers?.map((farmer) => ({
        ...farmer,
        revenue: farmerRevenue[farmer.id],
      }))

      return success(
        res,
        {
          salesByPeriod,
          commissionByPeriod,
          topFarmers: topFarmersWithRevenue,
          period,
          totalRevenue: Object.values(salesByPeriod).reduce((sum, val) => sum + val, 0),
          totalCommission: Object.values(commissionByPeriod).reduce((sum, val) => sum + val, 0),
        },
        "Sales analytics retrieved successfully",
      )
    } else if (type === "products") {
      // Product analytics
      const { data: productData } = await supabase
        .from("products")
        .select("category, is_organic, created_at")
        .gte("created_at", dateFilter)

      // Category distribution
      const categoryStats = {}
      const organicStats = { organic: 0, conventional: 0 }

      productData?.forEach((product) => {
        // Category stats
        if (!categoryStats[product.category]) {
          categoryStats[product.category] = 0
        }
        categoryStats[product.category]++

        // Organic stats
        if (product.is_organic) {
          organicStats.organic++
        } else {
          organicStats.conventional++
        }
      })

      // Get most reviewed products
      const { data: reviewedProducts } = await supabase
        .from("reviews")
        .select(`
          product_id,
          rating,
          product:products (
            id, title, category,
            farmer:users!farmer_id (
              name
            )
          )
        `)
        .gte("created_at", dateFilter)

      const productReviews = {}
      reviewedProducts?.forEach((review) => {
        const productId = review.product_id
        if (!productReviews[productId]) {
          productReviews[productId] = {
            product: review.product,
            reviewCount: 0,
            totalRating: 0,
          }
        }
        productReviews[productId].reviewCount++
        productReviews[productId].totalRating += review.rating
      })

      const mostReviewedProducts = Object.values(productReviews)
        .map((item) => ({
          ...item,
          averageRating: item.totalRating / item.reviewCount,
        }))
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, 10)

      return success(
        res,
        {
          categoryStats,
          organicStats,
          mostReviewedProducts,
          period,
          totalProducts: productData?.length || 0,
        },
        "Product analytics retrieved successfully",
      )
    } else {
      // Overview analytics
      const { data: userGrowth } = await supabase
        .from("users")
        .select("role, created_at")
        .gte("created_at", dateFilter)
        .neq("role", "admin")

      const { data: orderGrowth } = await supabase
        .from("orders")
        .select("status, created_at")
        .gte("created_at", dateFilter)

      // Group by period
      const usersByPeriod = {}
      const ordersByPeriod = {}

      userGrowth?.forEach((user) => {
        const date = new Date(user.created_at)
        const key =
          groupBy === "day"
            ? date.toISOString().split("T")[0]
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!usersByPeriod[key]) {
          usersByPeriod[key] = { farmers: 0, buyers: 0 }
        }
        usersByPeriod[key][user.role === "farmer" ? "farmers" : "buyers"]++
      })

      orderGrowth?.forEach((order) => {
        const date = new Date(order.created_at)
        const key =
          groupBy === "day"
            ? date.toISOString().split("T")[0]
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!ordersByPeriod[key]) {
          ordersByPeriod[key] = 0
        }
        ordersByPeriod[key]++
      })

      return success(
        res,
        {
          usersByPeriod,
          ordersByPeriod,
          period,
          totalNewUsers: userGrowth?.length || 0,
          totalNewOrders: orderGrowth?.length || 0,
        },
        "Overview analytics retrieved successfully",
      )
    }
  } catch (err) {
    console.error("Get analytics error:", err)
    return error(res, "Failed to retrieve analytics", 500)
  }
})

// Get commission tracking
router.get("/commission", async (req, res) => {
  try {
    const { period = "month", farmerId } = req.query

    // Calculate date range
    const now = new Date()
    let dateFilter

    switch (period) {
      case "week":
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
        break
      case "year":
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        break
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    let query = supabase
      .from("orders")
      .select(`
        total_price,
        commission_amount,
        status,
        created_at,
        farmer:users!farmer_id (
          id, name, email
        )
      `)
      .eq("status", "delivered")
      .gte("created_at", dateFilter)

    if (farmerId) {
      query = query.eq("farmer_id", farmerId)
    }

    const { data: orders } = await query.order("created_at", { ascending: false })

    // Calculate commission by farmer
    const commissionByFarmer = {}
    let totalCommission = 0
    let totalRevenue = 0

    orders?.forEach((order) => {
      const farmerId = order.farmer.id
      const commission = Number.parseFloat(order.commission_amount || 0)
      const revenue = Number.parseFloat(order.total_price)

      if (!commissionByFarmer[farmerId]) {
        commissionByFarmer[farmerId] = {
          farmer: order.farmer,
          totalRevenue: 0,
          totalCommission: 0,
          orderCount: 0,
        }
      }

      commissionByFarmer[farmerId].totalRevenue += revenue
      commissionByFarmer[farmerId].totalCommission += commission
      commissionByFarmer[farmerId].orderCount++

      totalCommission += commission
      totalRevenue += revenue
    })

    const commissionData = Object.values(commissionByFarmer).sort((a, b) => b.totalCommission - a.totalCommission)

    return success(
      res,
      {
        commissionData,
        summary: {
          totalRevenue,
          totalCommission,
          commissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
          totalOrders: orders?.length || 0,
        },
        period,
      },
      "Commission data retrieved successfully",
    )
  } catch (err) {
    console.error("Get commission error:", err)
    return error(res, "Failed to retrieve commission data", 500)
  }
})

// Get all disputes
router.get(
  "/disputes",
  validateQuery(
    Joi.object({
      status: Joi.string().valid("open", "in_progress", "resolved", "closed").optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { status, page, limit } = req.validatedQuery
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from("disputes")
        .select(
          `
          *,
          complainant:users!complainant_id (
            id, name, email, role
          ),
          respondent:users!respondent_id (
            id, name, email, role
          ),
          resolver:users!resolved_by (
            id, name
          ),
          order:orders (
            id, total_price, status
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (status) {
        query = query.eq("status", status)
      }

      const { data: disputes, error: disputeError, count } = await query

      if (disputeError) throw disputeError

      return paginated(
        res,
        disputes,
        {
          page,
          limit,
          total: count,
        },
        "Disputes retrieved successfully",
      )
    } catch (err) {
      console.error("Get disputes error:", err)
      return error(res, "Failed to retrieve disputes", 500)
    }
  },
)

// Update dispute status
router.patch(
  "/disputes/:id",
  validate(
    Joi.object({
      status: Joi.string().valid("in_progress", "resolved", "closed").required(),
      resolution: Joi.string().max(2000).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const { status, resolution } = req.validatedData

      const updates = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === "resolved" && resolution) {
        updates.resolution = resolution
        updates.resolved_by = req.user.id
      }

      const { data: dispute, error: disputeError } = await supabase
        .from("disputes")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          complainant:users!complainant_id (
            id, name, email
          ),
          respondent:users!respondent_id (
            id, name, email
          )
        `)
        .single()

      if (disputeError) throw disputeError

      return success(res, dispute, "Dispute updated successfully")
    } catch (err) {
      console.error("Update dispute error:", err)
      if (err.message?.includes("No rows")) {
        return error(res, "Dispute not found", 404)
      }
      return error(res, "Failed to update dispute", 500)
    }
  },
)

// Get all orders with filtering and pagination
router.get(
  "/orders",
  validateQuery(
    Joi.object({
      status: Joi.string().valid("pending", "confirmed", "shipped", "delivered", "cancelled").optional(),
      farmerId: Joi.string().optional(),
      buyerId: Joi.string().optional(),
      startDate: Joi.string().optional(),
      endDate: Joi.string().optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { status, farmerId, buyerId, startDate, endDate, page, limit } = req.validatedQuery
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from("orders")
        .select(
          `
          *,
          buyer:users!buyer_id (
            id, name, email, phone
          ),
          farmer:users!farmer_id (
            id, name, email, phone
          ),
          order_items (
            id, quantity, price_per_unit, total_price,
            product:products (
              id, title, photos, unit
            )
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (status) query = query.eq("status", status)
      if (farmerId) query = query.eq("farmer_id", farmerId)
      if (buyerId) query = query.eq("buyer_id", buyerId)
      if (startDate) query = query.gte("created_at", startDate)
      if (endDate) query = query.lte("created_at", endDate)

      const { data: orders, error: orderError, count } = await query

      if (orderError) throw orderError

      return paginated(
        res,
        orders,
        {
          page,
          limit,
          total: count,
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

    return success(res, order, "Order details retrieved successfully")
  } catch (err) {
    console.error("Get order details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Order not found", 404)
    }
    return error(res, "Failed to retrieve order details", 500)
  }
})

// Update order status
router.patch(
  "/orders/:id/status",
  validate(
    Joi.object({
      status: Joi.string().valid("pending", "confirmed", "shipped", "delivered", "cancelled").required(),
      notes: Joi.string().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const { status, notes } = req.validatedData

      const order = await Order.updateStatus(id, status, notes)

      // Log the action
      await supabase.from("admin_actions").insert([
        {
          admin_id: req.user.id,
          action_type: "update_order_status",
          target_id: id,
          reason: notes || null,
          created_at: new Date().toISOString(),
        },
      ])

      return success(res, order, "Order status updated successfully")
    } catch (err) {
      console.error("Update order status error:", err)
      return error(res, "Failed to update order status", 500)
    }
  },
)

// Get all products with filtering and pagination
router.get(
  "/products",
  validateQuery(
    Joi.object({
      category: Joi.string().optional(),
      isActive: Joi.boolean().optional(),
      farmerId: Joi.string().optional(),
      search: Joi.string().optional(),
      ...schemas.pagination,
    }),
  ),
  async (req, res) => {
    try {
      const { category, isActive, farmerId, search, page, limit } = req.validatedQuery
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from("products")
        .select(
          `
          *,
          farmer:users!farmer_id (
            id, name, email, phone
          )
        `,
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range(from, to)

      if (category) query = query.eq("category", category)
      if (isActive !== undefined) query = query.eq("is_active", isActive)
      if (farmerId) query = query.eq("farmer_id", farmerId)
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      const { data: products, error: productError, count } = await query

      if (productError) throw productError

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
      console.error("Get products error:", err)
      return error(res, "Failed to retrieve products", 500)
    }
  },
)

// Get specific product details
router.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params

    const product = await Product.findById(id)

    return success(res, product, "Product details retrieved successfully")
  } catch (err) {
    console.error("Get product details error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Product not found", 404)
    }
    return error(res, "Failed to retrieve product details", 500)
  }
})

// Update product status
router.patch(
  "/products/:id/status",
  validate(
    Joi.object({
      isActive: Joi.boolean().required(),
      reason: Joi.string().max(500).optional(),
    }),
  ),
  async (req, res) => {
    try {
      const { id } = req.params
      const { isActive, reason } = req.validatedData

      const product = await Product.update(id, { is_active: isActive })

      // Log the action
      await supabase.from("admin_actions").insert([
        {
          admin_id: req.user.id,
          action_type: isActive ? "activate_product" : "deactivate_product",
          target_id: id,
          reason: reason || null,
          created_at: new Date().toISOString(),
        },
      ])

      return success(res, product, `Product ${isActive ? "activated" : "deactivated"} successfully`)
    } catch (err) {
      console.error("Update product status error:", err)
      return error(res, "Failed to update product status", 500)
    }
  },
)

// Export data as CSV
router.get("/export/:type", async (req, res) => {
  try {
    const { type } = req.params
    const { format = "csv", startDate, endDate } = req.query

    let data = []
    let filename = ""

    // Date filtering
    const dateFilter = {}
    if (startDate) dateFilter.gte = startDate
    if (endDate) dateFilter.lte = endDate

    switch (type) {
      case "users":
        const { data: users } = await supabase
          .from("users")
          .select("id, name, email, role, phone, address, is_active, created_at")
          .neq("role", "admin")
          .order("created_at", { ascending: false })

        data = users || []
        filename = `users_export_${new Date().toISOString().split("T")[0]}`
        break

      case "orders":
        let orderQuery = supabase
          .from("orders")
          .select(`
            id, status, total_price, commission_amount, delivery_address, created_at,
            buyer:users!buyer_id (
              name, email
            ),
            farmer:users!farmer_id (
              name, email
            )
          `)
          .order("created_at", { ascending: false })

        if (dateFilter.gte) orderQuery = orderQuery.gte("created_at", dateFilter.gte)
        if (dateFilter.lte) orderQuery = orderQuery.lte("created_at", dateFilter.lte)

        const { data: orders } = await orderQuery

        data =
          orders?.map((order) => ({
            id: order.id,
            buyer_name: order.buyer?.name,
            buyer_email: order.buyer?.email,
            farmer_name: order.farmer?.name,
            farmer_email: order.farmer?.email,
            status: order.status,
            total_price: order.total_price,
            commission_amount: order.commission_amount,
            delivery_address: order.delivery_address,
            created_at: order.created_at,
          })) || []

        filename = `orders_export_${new Date().toISOString().split("T")[0]}`
        break

      case "products":
        const { data: products } = await supabase
          .from("products")
          .select(`
            id, title, description, price, stock, category, unit, is_organic, is_active, created_at,
            farmer:users!farmer_id (
              name, email
            )
          `)
          .order("created_at", { ascending: false })

        data =
          products?.map((product) => ({
            id: product.id,
            title: product.title,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            unit: product.unit,
            is_organic: product.is_organic,
            is_active: product.is_active,
            farmer_name: product.farmer?.name,
            farmer_email: product.farmer?.email,
            created_at: product.created_at,
          })) || []

        filename = `products_export_${new Date().toISOString().split("T")[0]}`
        break

      case "commission":
        let commissionQuery = supabase
          .from("orders")
          .select(`
            id, total_price, commission_amount, status, created_at,
            farmer:users!farmer_id (
              name, email
            )
          `)
          .eq("status", "delivered")
          .order("created_at", { ascending: false })

        if (dateFilter.gte) commissionQuery = commissionQuery.gte("created_at", dateFilter.gte)
        if (dateFilter.lte) commissionQuery = commissionQuery.lte("created_at", dateFilter.lte)

        const { data: commissionOrders } = await commissionQuery

        data =
          commissionOrders?.map((order) => ({
            order_id: order.id,
            farmer_name: order.farmer?.name,
            farmer_email: order.farmer?.email,
            total_price: order.total_price,
            commission_amount: order.commission_amount,
            commission_rate: (
              (Number.parseFloat(order.commission_amount || 0) / Number.parseFloat(order.total_price)) *
              100
            ).toFixed(2),
            created_at: order.created_at,
          })) || []

        filename = `commission_export_${new Date().toISOString().split("T")[0]}`
        break

      default:
        return error(res, "Invalid export type", 400)
    }

    if (format === "excel") {
      const buffer = await generateExcelReport(data, filename)
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`)
      return res.send(buffer)
    } else {
      const csv = await generateCSVReport(data)
      res.setHeader("Content-Type", "text/csv")
      res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`)
      return res.send(csv)
    }
  } catch (err) {
    console.error("Export data error:", err)
    return error(res, "Failed to export data", 500)
  }
})

// Get all farmers with their profiles
router.get("/farmers", async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get all farmers with their profiles
    const { data: farmers, error: farmerError, count } = await supabase
      .from("users")
      .select(`
        id, name, email, phone, address, created_at,
        farmer_profile:farmer_profiles (
          description, location, established, certifications, specialties, image
        )
      `)
      .eq("role", "farmer")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (farmerError) throw farmerError

    // Get statistics for each farmer
    const farmersWithStats = await Promise.all(
      farmers?.map(async (farmer) => {
        // Get product count
        const { count: productCount } = await supabase
          .from("products")
          .select("id", { count: "exact" })
          .eq("farmer_id", farmer.id)
          .eq("is_active", true)

        // Get order count and revenue
        const { data: orders } = await supabase
          .from("orders")
          .select("total_price, status")
          .eq("farmer_id", farmer.id)

        const totalOrders = orders?.length || 0
        const totalRevenue = orders?.reduce((sum, o) => sum + Number.parseFloat(o.total_price || 0), 0) || 0

        // Get average rating
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("farmer_id", farmer.id)

        const averageRating = reviews?.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 4.5

        return {
          ...farmer,
          farmer_profile: farmer.farmer_profile || {},
          statistics: {
            productCount: productCount || 0,
            totalOrders,
            totalRevenue,
            averageRating,
            reviewCount: reviews?.length || 0,
          }
        }
      }) || []
    )

    return paginated(
      res,
      farmersWithStats,
      {
        page: Number(page),
        limit: Number(limit),
        total: count,
      },
      "Farmers retrieved successfully",
    )
  } catch (err) {
    console.error("Get farmers error:", err)
    return error(res, "Failed to retrieve farmers", 500)
  }
})

// Get seasonal demand forecasting
router.get("/analytics/seasonal", async (req, res) => {
  try {
    const { category } = req.query

    // Get historical order data for the past year
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()

    const query = supabase
      .from("order_items")
      .select(`
        quantity,
        product:products (
          category, title
        ),
        order:orders!inner (
          created_at, status
        )
      `)
      .eq("order.status", "delivered")
      .gte("order.created_at", oneYearAgo)

    const { data: orderItems } = await query

    // Group by month and category
    const seasonalData = {}
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    orderItems?.forEach((item) => {
      const date = new Date(item.order.created_at)
      const month = monthNames[date.getMonth()]
      const productCategory = item.product.category

      if (category && productCategory !== category) return

      if (!seasonalData[productCategory]) {
        seasonalData[productCategory] = {}
      }

      if (!seasonalData[productCategory][month]) {
        seasonalData[productCategory][month] = {
          quantity: 0,
          orders: 0,
        }
      }

      seasonalData[productCategory][month].quantity += item.quantity
      seasonalData[productCategory][month].orders += 1
    })

    // Calculate trends and predictions
    const trends = {}
    Object.entries(seasonalData).forEach(([cat, monthlyData]) => {
      const months = monthNames.map((month) => ({
        month,
        quantity: monthlyData[month]?.quantity || 0,
        orders: monthlyData[month]?.orders || 0,
      }))

      // Simple trend calculation (could be enhanced with more sophisticated algorithms)
      const totalQuantity = months.reduce((sum, m) => sum + m.quantity, 0)
      const avgQuantity = totalQuantity / 12

      const peakMonths = months.filter((m) => m.quantity > avgQuantity * 1.2).map((m) => m.month)

      const lowMonths = months.filter((m) => m.quantity < avgQuantity * 0.8).map((m) => m.month)

      trends[cat] = {
        monthlyData: months,
        averageMonthlyQuantity: avgQuantity,
        peakMonths,
        lowMonths,
        seasonality: peakMonths.length > 0 ? "High" : lowMonths.length > 0 ? "Low" : "Stable",
      }
    })

    return success(
      res,
      {
        trends,
        period: "12 months",
        categories: Object.keys(trends),
      },
      "Seasonal demand forecast retrieved successfully",
    )
  } catch (err) {
    console.error("Get seasonal forecast error:", err)
    return error(res, "Failed to retrieve seasonal forecast", 500)
  }
})

module.exports = router
