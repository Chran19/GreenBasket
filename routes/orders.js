const express = require("express")
const Joi = require("joi")
const { authenticateToken } = require("../middleware/auth")
const { validate, validateQuery, schemas } = require("../utils/validation")
const { success, error, paginated } = require("../utils/response")
const Order = require("../models/Order")
const { supabase } = require("../config/supabase")
const { generateInvoicePDF } = require("../utils/invoiceGenerator")
const { sendEmail, sendOrderNotification } = require("../utils/emailService")
const { createNotification, getNotifications, markNotificationAsRead, getUnreadCount, markAllNotificationsAsRead } = require("../utils/notifications")

const router = express.Router()

// Apply authentication to all order routes
router.use(authenticateToken)

// Get all orders for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id
    const userRole = req.user.role

    let orders
    if (userRole === "admin") {
      // Admin can see all orders
      orders = await Order.findAll()
    } else if (userRole === "farmer") {
      // Farmer can see their own orders
      orders = await Order.findByFarmerId(userId)
    } else {
      // Buyer can see their own orders
      orders = await Order.findByBuyerId(userId)
    }

    return success(res, orders, "Orders retrieved successfully")
  } catch (err) {
    console.error("Get orders error:", err)
    return error(res, "Failed to retrieve orders", 500)
  }
})

// Get order details with invoice generation
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role
    const order = await Order.findById(id)

    // Check if user has access to this order
    const hasAccess =
      userRole === "admin" ||
      order.buyer_id === userId ||
      (userRole === "farmer" && order.farmer_id === userId)

    if (!hasAccess) {
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

// Generate and download invoice PDF
router.get("/details/:id/invoice", async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role
    const order = await Order.findById(id)

    // Check if user has access to this order
    const hasAccess =
      userRole === "admin" ||
      order.buyer_id === userId ||
      (userRole === "farmer" && order.farmer_id === userId)

    if (!hasAccess) {
      return error(res, "Order not found", 404)
    }

    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF(order)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice_${order.id}.pdf"`
    )
    res.send(pdfBuffer)
  } catch (err) {
    console.error("Generate invoice error:", err)
    return error(res, "Failed to generate invoice", 500)
  }
})

// Send invoice via email
router.post("/details/:id/send-invoice", async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role
    const order = await Order.findById(id)

    // Only farmer or admin can send invoices
    if (
      userRole !== "admin" &&
      (userRole !== "farmer" || order.farmer_id !== userId)
    ) {
      return error(res, "Unauthorized", 403)
    }

    // Generate PDF invoice
    const pdfBuffer = await generateInvoicePDF(order)

    // Send email with invoice attachment
    await sendEmail({
      to: order.buyer.email,
      subject: `Invoice for Order #${order.id}`,
      template: "invoice",
      data: {
        buyerName: order.buyer.name,
        orderId: order.id,
        totalAmount: order.total_price,
        farmerName: order.farmer.name,
      },
      attachments: [
        {
          filename: `invoice_${order.id}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })

    // Create notification
    await createNotification({
      userId: order.buyer_id,
      title: "Invoice Sent",
      message: `Invoice for order #${order.id} has been sent to your email`,
      type: "invoice_sent",
      data: { orderId: order.id },
    })

    return success(res, null, "Invoice sent successfully")
  } catch (err) {
    console.error("Send invoice error:", err)
    return error(res, "Failed to send invoice", 500)
  }
})

// Update order status (with notifications)
router.patch(
  "/:id/status",
  validate(
    Joi.object({
      status: Joi.string()
        .valid("confirmed", "shipped", "delivered", "cancelled")
        .required(),
      notes: Joi.string().max(500).optional(),
      trackingNumber: Joi.string().optional(),
    })
  ),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, trackingNumber } = req.validatedData;
      const userId = req.user.id;
      const userRole = req.user.role;
      const order = await Order.findById(id);

      if (
        userRole !== "admin" &&
        (userRole !== "farmer" || order.farmer_id !== userId)
      ) {
        return error(res, "Unauthorized", 403);
      }

      const updatedOrder = await Order.updateStatus(id, status, notes);

      if (trackingNumber && status === "shipped") {
        await supabase
          .from("orders")
          .update({ tracking_number: trackingNumber })
          .eq("id", id);
      }

      await sendOrderStatusNotification(updatedOrder, status, trackingNumber);

      // === AUTO INVOICE LOGIC WHEN ORDER IS CONFIRMED / DELIVERED ===
      if (status === "confirmed" || status === "delivered") {
        try {
          const pdfBuffer = await generateInvoicePDF(updatedOrder);

          await sendEmail({
            to: updatedOrder.buyer.email,
            subject: `Invoice for Order #${updatedOrder.id}`,
            template: "invoice",
            data: {
              buyerName: updatedOrder.buyer.name,
              orderId: updatedOrder.id,
              totalAmount: updatedOrder.total_price,
              farmerName: updatedOrder.farmer.name,
            },
            attachments: [
              {
                filename: `invoice_${updatedOrder.id}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
              },
            ],
          });

          await createNotification({
            userId: updatedOrder.buyer_id,
            title: "Invoice Sent",
            message: `Invoice for order #${updatedOrder.id} has been emailed to you`,
            type: "invoice_sent",
            data: { orderId: updatedOrder.id },
          });
        } catch (invoiceErr) {
          console.error("Auto invoice send failed:", invoiceErr);
        }
      }
      // ===============================================================

      return success(res, updatedOrder, "Order status updated successfully");
    } catch (err) {
      console.error("Update order status error:", err);
      return error(res, "Failed to update order status", 500);
    }
  }
);



// Get user notifications
router.get(
  "/notifications/list",
  validateQuery(
    Joi.object({
      isRead: Joi.boolean().optional(),
      type: Joi.string().optional(),
      ...schemas.pagination,
    })
  ),
  async (req, res) => {
    try {
      const { isRead, type, page, limit } = req.validatedQuery
      const userId = req.user.id

      const notifications = await getNotifications(userId, {
        isRead,
        type,
        page,
        limit,
      })

      return paginated(
        res,
        notifications.data,
        {
          page,
          limit,
          total: notifications.total,
        },
        "Notifications retrieved successfully"
      )
    } catch (err) {
      console.error("Get notifications error:", err)
      return error(res, "Failed to retrieve notifications", 500)
    }
  }
)

// Mark notification as read
router.patch("/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params
    const userId = req.user.id

    const notification = await markNotificationAsRead(notificationId, userId)

    return success(res, notification, "Notification marked as read")
  } catch (err) {
    console.error("Mark notification read error:", err)
    if (err.message?.includes("No rows")) {
      return error(res, "Notification not found", 404)
    }
    return error(res, "Failed to mark notification as read", 500)
  }
})

// Mark all notifications as read
router.patch("/notifications/read-all", async (req, res) => {
  try {
    const userId = req.user.id

    const notifications = await markAllNotificationsAsRead(userId)

    return success(
      res,
      { count: notifications.length },
      "All notifications marked as read"
    )
  } catch (err) {
    console.error("Mark all notifications read error:", err)
    return error(res, "Failed to mark notifications as read", 500)
  }
})

// Get unread notification count
router.get("/notifications/unread-count", async (req, res) => {
  try {
    const userId = req.user.id
    const count = await getUnreadCount(userId)

    return success(res, { count }, "Unread count retrieved successfully")
  } catch (err) {
    console.error("Get unread count error:", err)
    return error(res, "Failed to get unread count", 500)
  }
})

// Helper function to send order status notifications
const sendOrderStatusNotification = async (
  order,
  status,
  trackingNumber = null
) => {
  try {
    const notificationData = {
      buyerNotification: null,
      farmerNotification: null,
      emailData: null,
    }

    switch (status) {
      case "confirmed":
        notificationData.buyerNotification = {
          userId: order.buyer_id,
          title: "Order Confirmed",
          message: `Your order #${order.id} has been confirmed by the farmer`,
          type: "order_confirmed",
          data: { orderId: order.id },
        }
        notificationData.emailData = {
          to: order.buyer.email,
          subject: "Order Confirmed",
          template: "order_confirmed",
          data: {
            buyerName: order.buyer.name,
            orderId: order.id,
            farmerName: order.farmer.name,
            totalAmount: order.total_price,
          },
        }
        break

      case "shipped":
        notificationData.buyerNotification = {
          userId: order.buyer_id,
          title: "Order Shipped",
          message: `Your order #${order.id} has been shipped${
            trackingNumber ? `(Tracking: ${trackingNumber})` : ""
          }`,
          type: "order_shipped",
          data: { orderId: order.id, trackingNumber },
        }
        notificationData.emailData = {
          to: order.buyer.email,
          subject: "Order Shipped",
          template: "order_shipped",
          data: {
            buyerName: order.buyer.name,
            orderId: order.id,
            farmerName: order.farmer.name,
            trackingNumber: trackingNumber || "Not provided",
            deliveryAddress: order.delivery_address,
          },
        }
        break

      case "delivered":
        notificationData.buyerNotification = {
          userId: order.buyer_id,
          title: "Order Delivered",
          message: `Your order #${order.id} has been delivered. Please leave a review!`,
          type: "order_delivered",
          data: { orderId: order.id },
        }
        notificationData.farmerNotification = {
          userId: order.farmer_id,
          title: "Order Delivered",
          message: `Order #${order.id} has been successfully delivered`,
          type: "order_delivered",
          data: { orderId: order.id },
        }
        notificationData.emailData = {
          to: order.buyer.email,
          subject: "Order Delivered",
          template: "order_delivered",
          data: {
            buyerName: order.buyer.name,
            orderId: order.id,
            farmerName: order.farmer.name,
          },
        }
        break

      case "cancelled":
        notificationData.buyerNotification = {
          userId: order.buyer_id,
          title: "Order Cancelled",
          message: `Your order #${order.id} has been cancelled`,
          type: "order_cancelled",
          data: { orderId: order.id },
        }
        notificationData.emailData = {
          to: order.buyer.email,
          subject: "Order Cancelled",
          template: "order_cancelled",
          data: {
            buyerName: order.buyer.name,
            orderId: order.id,
            farmerName: order.farmer.name,
            reason: order.notes || "No reason provided",
          },
        }
        break
    }

    // Send notifications
    if (notificationData.buyerNotification) {
      await createNotification(notificationData.buyerNotification)
    }
    if (notificationData.farmerNotification) {
      await createNotification(notificationData.farmerNotification)
    }

    // Send email
    if (notificationData.emailData) {
      await sendEmail(notificationData.emailData)
    }
  } catch (error) {
    console.error("Send order status notification error:", error)
    // Do not throw to avoid breaking main flow
  }
}

module.exports = router
