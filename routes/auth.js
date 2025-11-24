const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Joi = require("joi")
const { supabase, supabaseAdmin } = require("../config/supabase")
const { authenticateToken } = require("../middleware/auth")
const { success, error: sendError } = require("../utils/response")

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("buyer", "farmer").required(),
  phone: Joi.string().optional(),
  address: Joi.string().optional(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign({ userId, email, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" })
}

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { error: validationError, value } = registerSchema.validate(req.body || {})
    if (validationError) {
      return sendError(res, validationError.details[0].message, 400)
    }

    const { name, email, password, role, phone, address } = value || {}
    if (!name || !email || !password || !role) {
      return sendError(res, "Invalid payload", 400)
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUserError) {
      console.error("Supabase select existing user error:", existingUserError)
    }

    if (existingUser) {
      return sendError(res, "User already exists with this email", 409)
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert([
        {
          name,
          email,
          password_hash: passwordHash,
          role,
          phone,
          address,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id, name, email, role, phone, address, created_at")
      .single()

    if (error) {
      console.error("Registration error:", error)
      if (error.code === "23505") {
        return sendError(res, "User already exists with this email", 409)
      }
      const message = process.env.NODE_ENV === "development" ? error.message || "Failed to create user" : "Failed to create user"
      return sendError(res, message, 500)
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role)

    return success(
      res,
      { user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address,
          createdAt: user.created_at,
        }, token },
      "User registered successfully",
      201,
    )
  } catch (error) {
    console.error("Registration error:", error)
    const message = process.env.NODE_ENV === "development" ? error.message || "Internal server error" : "Internal server error"
    return sendError(res, message, 500)
  }
})

// Login user
router.post("/login", async (req, res) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body || {})
    if (validationError) {
      return sendError(res, validationError.details[0].message, 400)
    }

    const { email, password } = value || {}
    if (!email || !password) {
      return sendError(res, "Invalid email or password", 400)
    }

    // Find user
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, password_hash, is_active, phone, address")
      .eq("email", email)
      .single()

    if (error) {
      console.error("Supabase fetch user error:", error)
      return sendError(
        res,
        process.env.NODE_ENV === "development" ? error.message || "Invalid email or password" : "Invalid email or password",
        401,
      )
    }
    if (!user) {
      return sendError(res, "Invalid email or password", 401)
    }

    if (!user.is_active) {
      return sendError(res, "Account suspended. Contact support.", 403)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return sendError(res, "Invalid email or password", 401)
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role)

    return success(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      },
      token,
    }, "Login successful")
  } catch (error) {
    console.error("Login error:", error)
    const message = process.env.NODE_ENV === "development" ? error.message || "Internal server error" : "Internal server error"
    return sendError(res, message, 500)
  }
})

// Get current user profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, role, phone, address, bio, created_at, updated_at")
      .eq("id", req.user.id)
      .single()

    if (error) {
      return sendError(res, "User not found", 404)
    }

    return success(res, { user }, "Profile fetched successfully")
  } catch (error) {
    console.error("Profile fetch error:", error)
    return sendError(res, "Internal server error", 500)
  }
})

// Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const updateSchema = Joi.object({
      name: Joi.string().min(2).max(50).optional(),
      phone: Joi.string().optional(),
      address: Joi.string().optional(),
      bio: Joi.string().max(1000).optional(),
    })

    const { error: validationError, value } = updateSchema.validate(req.body)
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message })
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({
        ...value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)
      .select("id, name, email, role, phone, address, bio, updated_at")
      .single()

    if (error) {
      return res.status(500).json({ error: "Failed to update profile" })
    }

    res.json({
      message: "Profile updated successfully",
      user,
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Change password
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
    })
    const { error: validationError, value } = schema.validate(req.body || {})
    if (validationError) {
      return sendError(res, validationError.details[0].message, 400)
    }

    const { currentPassword, newPassword } = value

    // Fetch current password hash
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, password_hash")
      .eq("id", req.user.id)
      .single()

    if (userError || !user) {
      return sendError(res, "User not found", 404)
    }

    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      return sendError(res, "Current password is incorrect", 400)
    }

    const saltRounds = 12
    const newHash = await bcrypt.hash(newPassword, saltRounds)

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("id", req.user.id)

    if (updateError) {
      return sendError(res, "Failed to update password", 500)
    }

    return success(res, null, "Password updated successfully")
  } catch (error) {
    console.error("Change password error:", error)
    return sendError(res, "Internal server error", 500)
  }
})

// Delete account
router.delete("/account", authenticateToken, async (req, res) => {
  try {
    // Soft delete: mark inactive and anonymize PII
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_active: false,
        name: "Deleted User",
        email: `deleted_${req.user.id}@example.com`,
        phone: null,
        address: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.user.id)

    if (updateError) {
      return sendError(res, "Failed to delete account", 500)
    }

    return success(res, null, "Account deleted successfully")
  } catch (error) {
    console.error("Delete account error:", error)
    return sendError(res, "Internal server error", 500)
  }
})

// Refresh token
router.post("/refresh", authenticateToken, async (req, res) => {
  try {
    const token = generateToken(req.user.id, req.user.email, req.user.role)
    res.json({ token })
  } catch (error) {
    console.error("Token refresh error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
