const nodemailer = require("nodemailer")
const { supabase } = require("../config/supabase")

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Email templates
const emailTemplates = {
  order_placed: (data) => ({
    subject: `Order Confirmation - #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Order Placed Successfully!</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Thank you for your order! Your order has been placed successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
          <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
        </div>
        
        <p>The farmer will confirm your order soon. You'll receive another email once it's confirmed.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  order_confirmed: (data) => ({
    subject: `Order Confirmed - #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Order Confirmed!</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Great news! Your order has been confirmed by ${data.farmerName}.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
        </div>
        
        <p>Your order is now being prepared for shipment. You'll receive a tracking notification once it's shipped.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  order_shipped: (data) => ({
    subject: `Order Shipped - #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Order Shipped!</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Your order has been shipped by ${data.farmerName}!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Shipping Details:</h3>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
        </div>
        
        <p>Your fresh produce is on its way! You'll receive another notification once it's delivered.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  order_delivered: (data) => ({
    subject: `Order Delivered - #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Order Delivered!</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Your order from ${data.farmerName} has been successfully delivered!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
        </div>
        
        <p>We hope you enjoy your fresh produce! Please consider leaving a review to help other customers and support the farmer.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  order_cancelled: (data) => ({
    subject: `Order Cancelled - #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d32f2f;">Order Cancelled</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Unfortunately, your order from ${data.farmerName} has been cancelled.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        
        <p>If payment was made, a refund will be processed within 3-5 business days.</p>
        <p>We apologize for any inconvenience. Please feel free to browse other products from our farmers.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  price_drop: (data) => ({
    subject: `Price Drop Alert - ${data.productTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Price Drop Alert!</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Great news! The price of a product you're interested in has dropped!</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>${data.productTitle}</h3>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Old Price:</strong> <span style="text-decoration: line-through;">$${data.oldPrice}</span></p>
          <p><strong>New Price:</strong> <span style="color: #d32f2f; font-size: 18px;">$${data.newPrice}</span></p>
          <p><strong>You Save:</strong> $${(data.oldPrice - data.newPrice).toFixed(2)}</p>
        </div>
        
        <p>Don't miss out on this great deal! Visit our marketplace to order now.</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),

  invoice: (data) => ({
    subject: `Invoice - Order #${data.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a27;">Invoice for Your Order</h2>
        <p>Dear ${data.buyerName},</p>
        <p>Please find attached the invoice for your recent order.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Total Amount:</strong> $${data.totalAmount}</p>
        </div>
        
        <p>Thank you for your business!</p>
        <p>Best regards,<br>Farm Fresh Marketplace Team</p>
      </div>
    `,
  }),
}

// Send email function
const sendEmail = async ({ to, subject, template, data, attachments = [] }) => {
  try {
    const transporter = createTransporter()

    let emailContent = { subject, html: "" }

    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data)
    } else if (subject) {
      emailContent.subject = subject
      emailContent.html = data?.html || ""
    }

    const mailOptions = {
      from: `"Farm Fresh Marketplace" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", result.messageId)

    // Log email in database
    await supabase.from("email_logs").insert([
      {
        recipient: to,
        subject: emailContent.subject,
        template: template || "custom",
        status: "sent",
        message_id: result.messageId,
        sent_at: new Date().toISOString(),
      },
    ])

    return result
  } catch (error) {
    console.error("Email send error:", error)

    // Log failed email
    await supabase.from("email_logs").insert([
      {
        recipient: to,
        subject: subject || "Unknown",
        template: template || "custom",
        status: "failed",
        error_message: error.message,
        sent_at: new Date().toISOString(),
      },
    ])

    throw error
  }
}

// Send order notification (wrapper function)
const sendOrderNotification = async (order, type, additionalData = {}) => {
  try {
    const templateData = {
      buyerName: order.buyer.name,
      orderId: order.id,
      farmerName: order.farmer.name,
      totalAmount: order.total_price,
      deliveryAddress: order.delivery_address,
      ...additionalData,
    }

    await sendEmail({
      to: order.buyer.email,
      template: type,
      data: templateData,
    })
  } catch (error) {
    console.error("Send order notification error:", error)
    // Don't throw to avoid breaking the main flow
  }
}

module.exports = {
  sendEmail,
  sendOrderNotification,
  emailTemplates,
}
