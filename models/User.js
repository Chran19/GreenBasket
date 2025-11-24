const { supabase } = require("../config/supabase")

class User {
  static async findById(id) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, phone, address, is_active, created_at, updated_at")
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, password_hash, phone, address, is_active, created_at")
      .eq("email", email)
      .single()

    if (error) throw error
    return data
  }

  static async create(userData) {
    const { data, error } = await supabase
      .from("users")
      .insert([userData])
      .select("id, name, email, role, phone, address, created_at")
      .single()

    if (error) throw error
    return data
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, email, role, phone, address, updated_at")
      .single()

    if (error) throw error
    return data
  }

  static async getAllUsers(filters = {}, pagination = {}) {
    let query = supabase
      .from("users")
      .select("id, name, email, role, phone, address, is_active, created_at", { count: "exact" })

    // Apply filters
    if (filters.role) query = query.eq("role", filters.role)
    if (filters.is_active !== undefined) query = query.eq("is_active", filters.is_active)
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    // Apply pagination
    const { page = 1, limit = 20 } = pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to).order("created_at", { ascending: false })

    const { data, error, count } = await query

    if (error) throw error
    return { users: data, total: count }
  }

  static async toggleUserStatus(id, isActive) {
    const { data, error } = await supabase
      .from("users")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, name, email, is_active")
      .single()

    if (error) throw error
    return data
  }
}

module.exports = User
