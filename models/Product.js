const { supabase } = require("../config/supabase")

class Product {
  static async create(productData) {
    const { data, error } = await supabase.from("products").insert([productData]).select("*").single()

    if (error) throw error
    return data
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        farmer:users!farmer_id (
          id, name, email, phone
        )
      `,
      )
      .eq("id", id)
      .eq("is_active", true)
      .single()

    if (error) throw error
    return data
  }

  static async findByFarmerId(farmerId, pagination = {}) {
    const { page = 1, limit = 20 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("farmer_id", farmerId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error
    return { products: data, total: count }
  }

  static async search(filters = {}, pagination = {}) {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        farmer:users!farmer_id (
          id, name
        )
      `,
        { count: "exact" },
      )
      .eq("is_active", true)

    // Apply filters
    if (filters.category) query = query.eq("category", filters.category)
    if (filters.minPrice) query = query.gte("price", filters.minPrice)
    if (filters.maxPrice) query = query.lte("price", filters.maxPrice)
    if (filters.isOrganic !== undefined) query = query.eq("is_organic", filters.isOrganic)
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters.inStock) query = query.gt("stock", 0)

    // Apply sorting
    const sortBy = filters.sortBy || "created_at"
    const sortOrder = filters.sortOrder === "asc" ? { ascending: true } : { ascending: false }
    query = query.order(sortBy, sortOrder)

    // Apply pagination
    const { page = 1, limit = 20 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error
    return { products: data, total: count }
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from("products")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return data
  }

  static async delete(id) {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) throw error
    return true
  }

  static async updateStock(id, newStock) {
    const { data, error } = await supabase
      .from("products")
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, title, stock")
      .single()

    if (error) throw error
    return data
  }

  static async getLowStockProducts(farmerId, threshold = 10) {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, stock, price")
      .eq("farmer_id", farmerId)
      .eq("is_active", true)
      .lte("stock", threshold)
      .order("stock", { ascending: true })

    if (error) throw error
    return data
  }
}

module.exports = Product
