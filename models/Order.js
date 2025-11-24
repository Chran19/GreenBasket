const { supabase } = require("../config/supabase")

class Order {
  static async create(orderData, items = []) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([orderData])
    .select("*")
    .single();

  if (orderError) throw orderError;

  if (items.length > 0) {
    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      price_per_unit: i.price_per_unit
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;
  }

  return await Order.findById(order.id);
}


  static async findById(id) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:users!buyer_id (
          id,
          name,
          email,
          phone
        ),
        farmer:users!farmer_id (
          id,
          name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          price_per_unit,
          total_price,
          product:products (
            id,
            title,
            photos,
            unit
          )
        )
      `
      )
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  static async findByBuyerId(buyerId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("orders")
      .select(
        `
        *,
        farmer:users!farmer_id (
          id,
          name
        ),
        order_items (
          id,
          quantity,
          total_price,
          product:products (
            id,
            title,
            photos
          )
        )
      `,
        { count: "exact" }
      )
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error
    return { orders: data, total: count }
  }

  static async findByFarmerId(farmerId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("orders")
      .select(
        `
        *,
        buyer:users!buyer_id (
          id,
          name,
          email,
          phone
        ),
        order_items (
          id,
          quantity,
          total_price,
          product:products (
            id,
            title,
            photos
          )
        )
      `,
        { count: "exact" }
      )
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error
    return { orders: data, total: count }
  }

  static async updateStatus(id, status, notes = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (notes) updates.notes = notes

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return data
  }

  static async updatePaymentStatus(id, paymentStatus, paymentId = null) {
    const updates = {
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    }

    if (paymentId) updates.razorpay_payment_id = paymentId

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return data
  }

  static async getOrderStats(farmerId = null, buyerId = null) {
    let query = supabase
      .from("orders")
      .select("status, total_price, created_at")

    if (farmerId) query = query.eq("farmer_id", farmerId)
    if (buyerId) query = query.eq("buyer_id", buyerId)

    const { data, error } = await query
    if (error) throw error

    // Calculate stats
    const stats = {
      total: data.length,
      pending: data.filter((o) => o.status === "pending").length,
      confirmed: data.filter((o) => o.status === "confirmed").length,
      shipped: data.filter((o) => o.status === "shipped").length,
      delivered: data.filter((o) => o.status === "delivered").length,
      cancelled: data.filter((o) => o.status === "cancelled").length,
      totalRevenue: data.reduce(
        (sum, o) => sum + Number.parseFloat(o.total_price),
        0
      ),
    }

    return stats
  }
}

module.exports = Order
