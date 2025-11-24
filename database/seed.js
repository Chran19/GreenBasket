require("dotenv").config()
const { supabase } = require("../config/supabase")
const bcrypt = require("bcryptjs")

const seedData = async () => {
  try {
    console.log("🌱 Starting database seeding...")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    const { data: admin } = await supabase
      .from("users")
      .insert([
        {
          name: "Admin User",
          email: "admin@farmmarket.com",
          password_hash: adminPassword,
          role: "admin",
          phone: "+1234567890",
          is_active: true,
        },
      ])
      .select("id")
      .single()

    // Create sample farmers
    const farmerPassword = await bcrypt.hash("farmer123", 12)
    const farmers = [
      {
        name: "John Smith",
        email: "john@farmmarket.com",
        password_hash: farmerPassword,
        role: "farmer",
        phone: "+1234567891",
        address: "123 Farm Road, Rural County, State 12345",
      },
      {
        name: "Sarah Johnson",
        email: "sarah@farmmarket.com",
        password_hash: farmerPassword,
        role: "farmer",
        phone: "+1234567892",
        address: "456 Green Valley, Farm Town, State 12346",
      },
    ]

    const { data: createdFarmers } = await supabase.from("users").insert(farmers).select("id, name")

    // Create sample buyers
    const buyerPassword = await bcrypt.hash("buyer123", 12)
    const buyers = [
      {
        name: "Alice Brown",
        email: "alice@example.com",
        password_hash: buyerPassword,
        role: "buyer",
        phone: "+1234567893",
        address: "789 City Street, Urban Area, State 12347",
      },
      {
        name: "Bob Wilson",
        email: "bob@example.com",
        password_hash: buyerPassword,
        role: "buyer",
        phone: "+1234567894",
        address: "321 Suburb Lane, Residential Area, State 12348",
      },
    ]

    const { data: createdBuyers } = await supabase.from("users").insert(buyers).select("id, name")

    // Create sample products
    const products = [
      {
        farmer_id: createdFarmers[0].id,
        title: "Fresh Organic Tomatoes",
        description: "Vine-ripened organic tomatoes, perfect for salads and cooking",
        price: 4.99,
        stock: 50,
        category: "vegetables",
        photos: ["/images/tomatoes.jpg"],
        unit: "kg",
        is_organic: true,
      },
      {
        farmer_id: createdFarmers[0].id,
        title: "Sweet Corn",
        description: "Fresh sweet corn, harvested daily",
        price: 3.49,
        stock: 30,
        category: "vegetables",
        photos: ["/images/corn.jpeg"],
        unit: "piece",
        is_organic: false,
      },
      {
        farmer_id: createdFarmers[1].id,
        title: "Organic Apples",
        description: "Crisp and sweet organic apples from our orchard",
        price: 5.99,
        stock: 40,
        category: "fruits",
        photos: ["/images/apples.jpg"],
        unit: "kg",
        is_organic: true,
      },
      {
        farmer_id: createdFarmers[1].id,
        title: "Fresh Milk",
        description: "Farm-fresh whole milk from grass-fed cows",
        price: 3.99,
        stock: 20,
        category: "dairy",
        photos: ["/images/milk.jpg"],
        unit: "liter",
        is_organic: true,
      },
    ]

    const { data: createdProducts } = await supabase.from("products").insert(products).select("id, title")

    // Create sample orders
    const sampleOrder = {
      buyer_id: createdBuyers[0].id,
      farmer_id: createdFarmers[0].id,
      status: "delivered",
      total_price: 14.97,
      delivery_address: "789 City Street, Urban Area, State 12347",
      payment_status: "paid",
      commission_amount: 1.05, // 7% of total
    }

    const { data: createdOrder } = await supabase.from("orders").insert([sampleOrder]).select("id").single()

    // Create order items
    const orderItems = [
      {
        order_id: createdOrder.id,
        product_id: createdProducts[0].id,
        quantity: 2,
        price_per_unit: 4.99,
        total_price: 9.98,
      },
      {
        order_id: createdOrder.id,
        product_id: createdProducts[1].id,
        quantity: 1,
        price_per_unit: 4.99,
        total_price: 4.99,
      },
    ]

    await supabase.from("order_items").insert(orderItems)

    // Create sample reviews
    const reviews = [
      {
        product_id: createdProducts[0].id,
        buyer_id: createdBuyers[0].id,
        order_id: createdOrder.id,
        rating: 5,
        comment: "Excellent quality tomatoes! Very fresh and tasty.",
        is_verified: true,
      },
      {
        product_id: createdProducts[2].id,
        buyer_id: createdBuyers[1].id,
        rating: 4,
        comment: "Good apples, but could be a bit sweeter.",
        is_verified: false,
      },
    ]

    await supabase.from("reviews").insert(reviews)

    console.log("✅ Database seeding completed successfully!")
    console.log("📧 Admin login: admin@farmmarket.com / admin123")
    console.log("👨‍🌾 Farmer login: john@farmmarket.com / farmer123")
    console.log("🛒 Buyer login: alice@example.com / buyer123")
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    throw error
  }
}

module.exports = { seedData }

// Run seeding if called directly
if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
