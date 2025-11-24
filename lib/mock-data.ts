export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  farmer: string
  rating: number
  reviewCount: number
  description: string
  inStock: boolean
  unit: string
}

export interface Category {
  id: string
  name: string
  image: string
  productCount: number
}

export const categories: Category[] = [
  {
    id: "vegetables",
    name: "Fresh Vegetables",
    image: "/fresh-vegetables.png",
    productCount: 45,
  },
  {
    id: "fruits",
    name: "Fruits",
    image: "/fresh-fruits.png",
    productCount: 32,
  },
  {
    id: "grains",
    name: "Grains & Cereals",
    image: "/grains-cereals.png",
    productCount: 28,
  },
  {
    id: "dairy",
    name: "Dairy Products",
    image: "/assorted-dairy.png",
    productCount: 18,
  },
  {
    id: "herbs",
    name: "Herbs & Spices",
    image: "/herbs-and-spices.png",
    productCount: 24,
  },
  {
    id: "organic",
    name: "Organic Produce",
    image: "/organic-produce-display.png",
    productCount: 36,
  },
]

export const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Organic Tomatoes",
    price: 4.99,
    originalPrice: 6.99,
    image: "/organic-tomatoes.png",
    category: "vegetables",
    farmer: "Green Valley Farm",
    rating: 4.8,
    reviewCount: 124,
    description: "Fresh, juicy organic tomatoes grown without pesticides",
    inStock: true,
    unit: "per lb",
  },
  {
    id: "2",
    name: "Farm Fresh Eggs",
    price: 5.49,
    image: "/farm-fresh-eggs.png",
    category: "dairy",
    farmer: "Sunrise Poultry",
    rating: 4.9,
    reviewCount: 89,
    description: "Free-range eggs from happy hens",
    inStock: true,
    unit: "dozen",
  },
  {
    id: "3",
    name: "Organic Apples",
    price: 3.99,
    originalPrice: 4.99,
    image: "/organic-apples.png",
    category: "fruits",
    farmer: "Mountain Orchard",
    rating: 4.7,
    reviewCount: 156,
    description: "Crisp, sweet organic apples perfect for snacking",
    inStock: true,
    unit: "per lb",
  },
  {
    id: "4",
    name: "Whole Wheat Flour",
    price: 8.99,
    image: "/whole-wheat-flour.png",
    category: "grains",
    farmer: "Heritage Mills",
    rating: 4.6,
    reviewCount: 67,
    description: "Stone-ground whole wheat flour from heritage grains",
    inStock: true,
    unit: "5 lb bag",
  },
  {
    id: "5",
    name: "Fresh Basil",
    price: 2.99,
    image: "/fresh-basil.png",
    category: "herbs",
    farmer: "Herb Haven",
    rating: 4.8,
    reviewCount: 43,
    description: "Aromatic fresh basil perfect for cooking",
    inStock: true,
    unit: "bunch",
  },
  {
    id: "6",
    name: "Organic Carrots",
    price: 2.49,
    image: "/organic-carrots.png",
    category: "vegetables",
    farmer: "Earth's Bounty",
    rating: 4.5,
    reviewCount: 92,
    description: "Sweet, crunchy organic carrots",
    inStock: true,
    unit: "per lb",
  },
]

export const trendingDeals: Product[] = [
  {
    id: "7",
    name: "Seasonal Vegetable Box",
    price: 24.99,
    originalPrice: 34.99,
    image: "/placeholder-5yxp9.png",
    category: "vegetables",
    farmer: "Local Harvest Co-op",
    rating: 4.9,
    reviewCount: 203,
    description: "Assorted seasonal vegetables from local farms",
    inStock: true,
    unit: "box",
  },
  {
    id: "8",
    name: "Artisan Cheese Selection",
    price: 18.99,
    originalPrice: 24.99,
    image: "/artisan-cheese.png",
    category: "dairy",
    farmer: "Meadowbrook Dairy",
    rating: 4.7,
    reviewCount: 78,
    description: "Handcrafted artisan cheeses made from grass-fed milk",
    inStock: true,
    unit: "selection",
  },
]

export const allProducts: Product[] = [
  ...featuredProducts,
  ...trendingDeals,
  // Additional products for comprehensive catalog
  {
    id: "9",
    name: "Organic Kale",
    price: 3.49,
    image: "/placeholder.png?height=300&width=300&text=Organic+Kale",
    category: "vegetables",
    farmer: "Green Valley Farm",
    rating: 4.6,
    reviewCount: 78,
    description: "Fresh, crispy organic kale perfect for salads and smoothies",
    inStock: true,
    unit: "bunch",
  },
  {
    id: "10",
    name: "Raw Honey",
    price: 12.99,
    image: "/placeholder.png?height=300&width=300&text=Raw+Honey",
    category: "organic",
    farmer: "Meadow Bee Farm",
    rating: 4.9,
    reviewCount: 145,
    description: "Pure, unfiltered raw honey from wildflower meadows",
    inStock: true,
    unit: "16 oz jar",
  },
  {
    id: "11",
    name: "Grass-Fed Beef",
    price: 18.99,
    originalPrice: 22.99,
    image: "/placeholder.png?height=300&width=300&text=Grass+Fed+Beef",
    category: "dairy",
    farmer: "Prairie Ranch",
    rating: 4.8,
    reviewCount: 92,
    description: "Premium grass-fed beef from pasture-raised cattle",
    inStock: true,
    unit: "per lb",
  },
  {
    id: "12",
    name: "Heirloom Potatoes",
    price: 4.99,
    image: "/placeholder.png?height=300&width=300&text=Heirloom+Potatoes",
    category: "vegetables",
    farmer: "Heritage Farm",
    rating: 4.5,
    reviewCount: 67,
    description: "Colorful heirloom potatoes with unique flavors",
    inStock: true,
    unit: "3 lb bag",
  },
  {
    id: "13",
    name: "Organic Blueberries",
    price: 6.99,
    image: "/placeholder.png?height=300&width=300&text=Organic+Blueberries",
    category: "fruits",
    farmer: "Berry Hill Farm",
    rating: 4.7,
    reviewCount: 134,
    description: "Sweet, juicy organic blueberries packed with antioxidants",
    inStock: true,
    unit: "pint",
  },
  {
    id: "14",
    name: "Sourdough Bread",
    price: 7.49,
    image: "/placeholder.png?height=300&width=300&text=Sourdough+Bread",
    category: "grains",
    farmer: "Artisan Bakery",
    rating: 4.8,
    reviewCount: 89,
    description: "Traditional sourdough bread made with organic flour",
    inStock: true,
    unit: "loaf",
  },
  {
    id: "15",
    name: "Free-Range Chicken",
    price: 15.99,
    image: "/placeholder.png?height=300&width=300&text=Free+Range+Chicken",
    category: "dairy",
    farmer: "Happy Hen Farm",
    rating: 4.6,
    reviewCount: 76,
    description: "Tender, flavorful free-range chicken",
    inStock: false,
    unit: "whole chicken",
  },
]

export interface Order {
  id: string
  userId: string
  farmerId: string
  items: OrderItem[]
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  total: number
  createdAt: string
  deliveryDate?: string
  shippingAddress: string
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  farmerId: string
  farmerName: string
}

export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "1",
    farmerId: "2",
    items: [
      {
        productId: "1",
        productName: "Organic Tomatoes",
        quantity: 2,
        price: 4.99,
        farmerId: "2",
        farmerName: "Green Valley Farm",
      },
      {
        productId: "3",
        productName: "Organic Apples",
        quantity: 1,
        price: 3.99,
        farmerId: "2",
        farmerName: "Mountain Orchard",
      },
    ],
    status: "delivered",
    total: 13.97,
    createdAt: "2024-01-15",
    deliveryDate: "2024-01-17",
    shippingAddress: "123 Main St, Anytown, ST 12345",
  },
  {
    id: "ORD-002",
    userId: "1",
    farmerId: "2",
    items: [
      {
        productId: "2",
        productName: "Farm Fresh Eggs",
        quantity: 2,
        price: 5.49,
        farmerId: "2",
        farmerName: "Sunrise Poultry",
      },
    ],
    status: "shipped",
    total: 10.98,
    createdAt: "2024-01-18",
    deliveryDate: "2024-01-20",
    shippingAddress: "123 Main St, Anytown, ST 12345",
  },
]

export interface FarmerProfile {
  id: string
  name: string
  description: string
  location: string
  established: string
  certifications: string[]
  specialties: string[]
  rating: number
  reviewCount: number
  image: string
  products: string[]
}

export const farmerProfiles: FarmerProfile[] = [
  {
    id: "1",
    name: "Green Valley Farm",
    description:
      "Family-owned organic farm committed to sustainable agriculture and providing the freshest produce to our community.",
    location: "Sonoma County, CA",
    established: "2003",
    certifications: ["USDA Organic", "Certified Naturally Grown"],
    specialties: ["Organic Vegetables", "Heirloom Varieties"],
    rating: 4.8,
    reviewCount: 234,
    image: "/placeholder.png?height=200&width=200&text=Green+Valley+Farm",
    products: ["1", "9", "12"],
  },
  {
    id: "2",
    name: "Sunrise Poultry",
    description: "Raising happy, healthy chickens on pasture using traditional farming methods for over 20 years.",
    location: "Lancaster County, PA",
    established: "2001",
    certifications: ["Certified Humane", "Pasture Raised"],
    specialties: ["Free-Range Eggs", "Pasture-Raised Poultry"],
    rating: 4.9,
    reviewCount: 189,
    image: "/placeholder.png?height=200&width=200&text=Sunrise+Poultry",
    products: ["2", "15"],
  },
  {
    id: "3",
    name: "Mountain Orchard",
    description:
      "High-altitude orchard specializing in crisp, flavorful apples and stone fruits grown without synthetic pesticides.",
    location: "Hood River Valley, OR",
    established: "1995",
    certifications: ["USDA Organic", "Salmon-Safe"],
    specialties: ["Organic Fruits", "Heirloom Apples"],
    rating: 4.7,
    reviewCount: 156,
    image: "/placeholder.png?height=200&width=200&text=Mountain+Orchard",
    products: ["3", "13"],
  },
]
