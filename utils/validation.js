const Joi = require("joi")

// Common validation schemas
const schemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d\s\-$$$$]{7,15}$/)
    .optional(),
  price: Joi.number().positive().precision(2).required(),
  rating: Joi.number().min(1).max(5).required(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },
}

// FIXED SCHEMA for placing an order
schemas.orderCreate = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().positive().required(),
        price: Joi.number().positive().required(),
        farmerId: Joi.string().uuid().required(),
      })
    )
    .min(1)
    .required(),

  total: Joi.number().positive().required(),
  deliveryAddress: Joi.string().min(5).required(),
  notes: Joi.string().allow("").optional(),

  // REQUIRED Razorpay fields
  razorpay_payment_id: Joi.string().required(),
  razorpay_order_id: Joi.string().required(),
  razorpay_signature: Joi.string().optional(),
}).unknown(true)     // <-- FIX: allow extra fields from frontend/webhooks

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path[0],
      })
    }
    req.validatedData = value
    next()
  }
}

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path[0],
      })
    }
    req.validatedQuery = value
    next()
  }
}

module.exports = {
  schemas,
  validate,
  validateQuery,
}
