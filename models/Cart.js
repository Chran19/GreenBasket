const { supabase } = require("../config/supabase")

class Cart {
  static async addItem(buyerId, productId, quantity) {
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("buyer_id", buyerId)
      .eq("product_id", productId)
      .single()

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select("*")
        .single()

      if (error) throw error
      return data
    } else {
      // Add new item
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            buyer_id: buyerId,
            product_id: productId,
            quantity,
          },
        ])
        .select("*")
        .single()

      if (error) throw error
      return data
    }
  }

  static async getCartItems(buyerId) {
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        id, quantity, created_at,
        product:products (
          id, title, price, stock, photos, unit,
          farmer:users!farmer_id (
            id, name
          )
        )
      `,
      )
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  static async updateQuantity(buyerId, productId, quantity) {
    if (quantity <= 0) {
      return await this.removeItem(buyerId, productId)
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("buyer_id", buyerId)
      .eq("product_id", productId)
      .select("*")
      .single()

    if (error) throw error
    return data
  }

  static async removeItem(buyerId, productId) {
    const { error } = await supabase.from("cart_items").delete().eq("buyer_id", buyerId).eq("product_id", productId)

    if (error) throw error
    return true
  }

  static async clearCart(buyerId) {
    const { error } = await supabase.from("cart_items").delete().eq("buyer_id", buyerId)

    if (error) throw error
    return true
  }

  static async getCartTotal(buyerId) {
    const items = await this.getCartItems(buyerId)
    const total = items.reduce((sum, item) => {
      return sum + item.quantity * Number.parseFloat(item.product.price)
    }, 0)

    return {
      items: items.length,
      total: Number.parseFloat(total.toFixed(2)),
    }
  }
}

module.exports = Cart
