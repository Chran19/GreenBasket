const cron = require("node-cron")
const { cleanupOldNotifications } = require("../utils/notifications")
const { supabase } = require("../config/supabase")

// Setup cron jobs for notification management
const setupNotificationCron = () => {
  // Clean up old notifications daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Running notification cleanup...")
    try {
      await cleanupOldNotifications(30) // Clean notifications older than 30 days
      console.log("Notification cleanup completed")
    } catch (error) {
      console.error("Notification cleanup failed:", error)
    }
  })

  // Check for subscription deliveries daily at 6 AM
  cron.schedule("0 6 * * *", async () => {
    console.log("Checking subscription deliveries...")
    try {
      const today = new Date().toISOString().split("T")[0]

      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select(`
          *,
          product:products (
            id, title, price, stock,
            farmer:users!farmer_id (
              id, name, email
            )
          ),
          buyer:users!buyer_id (
            id, name, email, address
          )
        `)
        .eq("is_active", true)
        .lte("next_delivery_date", today)

      for (const subscription of subscriptions || []) {
        // Check if product has sufficient stock
        if (subscription.product.stock >= subscription.quantity) {
          // Create automatic order for subscription
          // This would integrate with the existing order creation logic
          console.log(`Creating subscription order for user ${subscription.buyer_id}`)

          // Update next delivery date based on frequency
          const nextDate = new Date(subscription.next_delivery_date)
          switch (subscription.frequency) {
            case "weekly":
              nextDate.setDate(nextDate.getDate() + 7)
              break
            case "biweekly":
              nextDate.setDate(nextDate.getDate() + 14)
              break
            case "monthly":
              nextDate.setMonth(nextDate.getMonth() + 1)
              break
          }

          await supabase
            .from("subscriptions")
            .update({ next_delivery_date: nextDate.toISOString().split("T")[0] })
            .eq("id", subscription.id)
        } else {
          // Notify about insufficient stock
          await supabase.from("notifications").insert([
            {
              user_id: subscription.buyer_id,
              title: "Subscription Delivery Issue",
              message: `Your subscription for ${subscription.product.title} couldn't be processed due to insufficient stock`,
              type: "subscription_issue",
              data: { subscription_id: subscription.id, product_id: subscription.product.id },
            },
          ])
        }
      }

      console.log("Subscription delivery check completed")
    } catch (error) {
      console.error("Subscription delivery check failed:", error)
    }
  })

  console.log("Notification cron jobs setup completed")
}

module.exports = { setupNotificationCron }
