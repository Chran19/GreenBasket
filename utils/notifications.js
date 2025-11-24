const { supabase } = require("../config/supabase")

// Create notification
const createNotification = async ({ userId, title, message, type, data = {} }) => {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          title,
          message,
          type,
          data,
          is_read: false,
        },
      ])
      .select("*")
      .single()

    if (error) throw error

    // Emit real-time notification (if subscriptions are set up)
    await emitRealtimeNotification(userId, notification)

    return notification
  } catch (error) {
    console.error("Create notification error:", error)
    throw error
  }
}

// Get notifications for a user
const getNotifications = async (userId, filters = {}) => {
  try {
    const { isRead, type, page = 1, limit = 20 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (isRead !== undefined) {
      query = query.eq("is_read", isRead)
    }

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Get notifications error:", error)
    throw error
  }
}

// Mark notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error("Mark notification as read error:", error)
    throw error
  }
}

// Get unread count
const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("user_id", userId)
      .eq("is_read", false)

    if (error) throw error

    return count || 0
  } catch (error) {
    console.error("Get unread count error:", error)
    throw error
  }
}

// Emit real-time notification using Supabase channels
const emitRealtimeNotification = async (userId, notification) => {
  try {
    // This would be used with Supabase real-time subscriptions on the frontend
    // The backend just needs to insert into the notifications table
    // and the frontend can subscribe to changes

    console.log(`Real-time notification sent to user ${userId}:`, notification.title)
  } catch (error) {
    console.error("Emit real-time notification error:", error)
    // Don't throw to avoid breaking the main flow
  }
}

// Bulk create notifications
const createBulkNotifications = async (notifications) => {
  try {
    const { data, error } = await supabase.from("notifications").insert(notifications).select("*")

    if (error) throw error

    // Emit real-time notifications for each user
    for (const notification of data) {
      await emitRealtimeNotification(notification.user_id, notification)
    }

    return data
  } catch (error) {
    console.error("Create bulk notifications error:", error)
    throw error
  }
}

// Clean up old notifications (can be run as a cron job)
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase.from("notifications").delete().lt("created_at", cutoffDate).eq("is_read", true)

    if (error) throw error

    console.log(`Cleaned up notifications older than ${daysOld} days`)
  } catch (error) {
    console.error("Cleanup old notifications error:", error)
    throw error
  }
}

// Mark all notifications as read
const markAllNotificationsAsRead = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false)
      .select("id")

    if (error) throw error

    return data || []
  } catch (error) {
    console.error("Mark all notifications as read error:", error)
    throw error
  }
}

module.exports = {
  createNotification,
  getNotifications,
  markNotificationAsRead,
  getUnreadCount,
  emitRealtimeNotification,
  createBulkNotifications,
  cleanupOldNotifications,
  markAllNotificationsAsRead,
}
