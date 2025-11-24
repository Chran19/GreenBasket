const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables")
}

// Client for general operations
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin client for service operations
if (!supabaseServiceKey) {
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations (like login password check) may fail. Check your .env",
  )
}
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey)

module.exports = { supabase, supabaseAdmin }
