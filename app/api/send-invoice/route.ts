import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, orderId } = body;

    console.log("📌 API request received:", body);

    if (!email || !orderId) {
      throw new Error("Missing required fields");
    }

    // ➤ Fetch full order from DB
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select(
        `*, buyer:buyer_id(*), farmer:farmer_id(*), order_items(*, product:product_id(*))`
      )
      .eq("id", orderId)
      .single();

    if (fetchErr || !order) throw new Error("Order not found");

    // PDF path
    const pdfPath = path.join(process.cwd(), `invoice_${orderId}.pdf`);
const fontPath = path.join(process.cwd(),  "fonts", "Roboto_Condensed-Black.ttf"); // <-- correct folder

// Create PDF with your font as default
const doc = new PDFDocument({
  margin: 40,
  font: fontPath,
});

const stream = fs.createWriteStream(pdfPath);
doc.pipe(stream);


    
  

    // =============== HEADER ==================
doc
  .fontSize(26)
  .text("INVOICE", { align: "center" })
  .moveDown(0.5);

doc
  .fontSize(12)
  .text(" GreenBasket Marketplace", { align: "center" })
  .text("Connecting Farmers to Consumers", { align: "center" })
  .moveDown(2);

// Draw top separator line
doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1);

// =============== INVOICE METADATA BOX ==================
doc.fontSize(12);
doc.text(`Invoice #: ${order.id}`);
doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`);
doc.text(`Status: ${order.status.toUpperCase()}`);

doc.moveDown(1.5);
doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1.5);

// =============== ADDRESS SECTIONS (2 COLUMN) ==================
const startY = doc.y;

doc.fontSize(14).text("BILL TO", 40, startY);
doc.fontSize(12);
doc.text(order.buyer.name, 40, doc.y + 4);
doc.text(order.buyer.email);
doc.text(order.buyer.phone);

doc.fontSize(14).text("FARMER", 330, startY);
doc.fontSize(12);
doc.text(order.farmer.name, 330, doc.y + 4);
doc.text(order.farmer.email);
doc.text(order.farmer.phone);

doc.moveDown(2);
doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1.5);

// =============== ORDER ITEMS TABLE ==================
doc.fontSize(14).text("ORDER ITEMS");
doc.moveDown(0.7);
doc.fontSize(12);

// Table headers
const tableTop = doc.y;
doc.text("Item", 40, tableTop);
doc.text("Qty", 260, tableTop);
doc.text("Price", 320, tableTop);
doc.text("Total", 420, tableTop);

// header underline
doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

let currentY = tableTop + 25;
let subtotal = 0;

order.order_items.forEach((item: any) => {
  const itemTotal = parseFloat(item.total_price);
  subtotal += itemTotal;

  doc.text(item.product.title, 40, currentY, { width: 200 });
  doc.text(item.quantity.toString(), 260, currentY);
  doc.text(`₹${parseFloat(item.price_per_unit).toFixed(2)}`, 320, currentY);
  doc.text(`₹${itemTotal.toFixed(2)}`, 420, currentY);

  currentY += 22;
});

// table bottom line
doc.moveTo(40, currentY + 5).lineTo(555, currentY + 5).stroke();
doc.moveDown(2);

// =============== TOTAL BOX ==================
doc
  .fontSize(14)
  .text("TOTAL SUMMARY", 40, currentY + 20);

doc.moveDown(0.5);
doc.fontSize(12);

doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 40);
doc.text(`Delivery: ₹0`, 40); // you can replace with delivery charge later
doc.moveDown(0.5);

doc
  .fontSize(16)
  .text(`GRAND TOTAL: ₹${order.total_price}`, { align: "right" });

doc.moveDown(2);
doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1.5);

// =============== FOOTER ==================
doc
  .fontSize(10)
  .text("Thank you for shopping with us!", { align: "center" });
doc.text("Need help? Contact support@greenBasket.com", { align: "center" });
doc.end();
    await new Promise((r) => stream.on("finish", r));

    console.log("📌 PDF generated");

    // SEND EMAIL
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER!,
        pass: process.env.EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER!,
      to: email,
      subject: "Order Invoice",
      text: `Thank you for shopping with us. Your invoice for Order #${orderId} is attached.`,
      attachments: [{ filename: `invoice_${orderId}.pdf`, path: pdfPath }],
    });

    console.log("📌 Email sent successfully");

    // UPLOAD TO SUPABASE STORAGE
    const buffer = fs.readFileSync(pdfPath);
    const supabasePath = `product-images/invoice_${orderId}.pdf`;

    await supabase.storage.from("product-images").upload(supabasePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(supabasePath);

    await supabase.from("orders").update({ invoice_url: publicUrl }).eq("id", orderId);

    fs.unlinkSync(pdfPath);

    return NextResponse.json({ success: true, invoiceUrl: publicUrl });
  } catch (err: any) {
    console.log("❌ Email failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
