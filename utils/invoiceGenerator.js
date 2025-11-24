const PDFDocument = require("pdfkit")

const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      
      const buffers = []

      doc.on("data", buffers.push.bind(buffers))
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })

      // Header
      doc
        .fontSize(20)
        .text("INVOICE", 50, 50, { align: "center" })
        .fontSize(10)
        .text("Farm Fresh Marketplace", 50, 80, { align: "center" })
        .text("Connecting Farmers to Consumers", 50, 95, { align: "center" })

      // Invoice details
      doc
        .fontSize(12)
        .text(`Invoice #: ${order.id}`, 50, 130)
        .text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 50, 145)
        .text(`Status: ${order.status.toUpperCase()}`, 50, 160)

      // Buyer information
      doc
        .fontSize(14)
        .text("Bill To:", 50, 200)
        .fontSize(12)
        .text(order.buyer.name, 50, 220)
        .text(order.buyer.email, 50, 235)
        .text(order.buyer.phone || "N/A", 50, 250)
        .text("Delivery Address:", 50, 270)
        .text(order.delivery_address, 50, 285, { width: 200 })

      // Farmer information
      doc
        .fontSize(14)
        .text("From:", 350, 200)
        .fontSize(12)
        .text(order.farmer.name, 350, 220)
        .text(order.farmer.email, 350, 235)
        .text(order.farmer.phone || "N/A", 350, 250)

      // Order items table
      const tableTop = 350
      doc.fontSize(12)

      // Table headers
      doc
        .text("Item", 50, tableTop)
        .text("Qty", 250, tableTop)
        .text("Unit Price", 300, tableTop)
        .text("Total", 400, tableTop)

      // Draw header line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(500, tableTop + 15)
        .stroke()

      let yPosition = tableTop + 30
      let subtotal = 0

      // Order items
      order.order_items.forEach((item) => {
        const itemTotal = Number.parseFloat(item.total_price)
        subtotal += itemTotal

        doc
          .text(item.product.title, 50, yPosition, { width: 180 })
          .text(item.quantity.toString(), 250, yPosition)
          .text(`$${Number.parseFloat(item.price_per_unit).toFixed(2)}`, 300, yPosition)
          .text(`$${itemTotal.toFixed(2)}`, 400, yPosition)

        yPosition += 25
      })

      // Draw line before totals
      doc
        .moveTo(50, yPosition + 10)
        .lineTo(500, yPosition + 10)
        .stroke()

      yPosition += 30

      // Totals
      const totalPrice = Number.parseFloat(order.total_price)
      const commissionAmount = Number.parseFloat(order.commission_amount || 0)
      const farmerAmount = totalPrice - commissionAmount

      doc.text("Subtotal:", 350, yPosition).text(`$${subtotal.toFixed(2)}`, 400, yPosition)

      yPosition += 20

      if (order.delivery_date) {
        doc
          .text("Delivery Date:", 350, yPosition)
          .text(new Date(order.delivery_date).toLocaleDateString(), 400, yPosition)
        yPosition += 20
      }

      doc
        .fontSize(14)
        .text("Total Amount:", 350, yPosition)
        .text(`$${totalPrice.toFixed(2)}`, 400, yPosition)

      yPosition += 30

      // Payment information
      doc
        .fontSize(10)
        .text("Payment Information:", 50, yPosition)
        .text(`Payment Method: ${order.payment_method || "Razorpay"}`, 50, yPosition + 15)
        .text(`Payment Status: ${order.payment_status.toUpperCase()}`, 50, yPosition + 30)

      if (order.razorpay_payment_id) {
        doc.text(`Payment ID: ${order.razorpay_payment_id}`, 50, yPosition + 45)
      }

      // Platform fee information (for farmer)
      if (commissionAmount > 0) {
        yPosition += 80
        doc
          .fontSize(10)
          .text("Platform Fee Breakdown:", 50, yPosition)
          .text(`Gross Amount: $${totalPrice.toFixed(2)}`, 50, yPosition + 15)
          .text(`Platform Fee (7%): $${commissionAmount.toFixed(2)}`, 50, yPosition + 30)
          .text(`Farmer Payout: $${farmerAmount.toFixed(2)}`, 50, yPosition + 45)
      }

      // Footer
      doc
        .fontSize(8)
        .text("Thank you for using Farm Fresh Marketplace!", 50, doc.page.height - 100, { align: "center" })
        .text("For support, contact us at support@farmfresh.com", 50, doc.page.height - 85, { align: "center" })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

module.exports = {
  generateInvoicePDF,
}
