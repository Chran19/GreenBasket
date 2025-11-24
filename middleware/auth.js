const jwt = require("jsonwebtoken")
const { supabase } = require("../config/supabase")

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Fetch user from database to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, role, name, is_active")
      .eq("id", decoded.userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token or user not found" })
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account suspended" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(403).json({ error: "Invalid or expired token" })
  }
}

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const userRole = req.user.role
    const allowedRoles = Array.isArray(roles) ? roles : [roles]

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      })
    }

    next()
  }
}

// Specific role middlewares
const requireBuyer = requireRole("buyer")
const requireFarmer = requireRole("farmer")
const requireAdmin = requireRole("admin")
const requireFarmerOrAdmin = requireRole(["farmer", "admin"])

module.exports = {
  authenticateToken,
  requireRole,
  requireBuyer,
  requireFarmer,
  requireAdmin,
  requireFarmerOrAdmin,
}
