const { supabase, supabaseAdmin } = require("../config/supabase")
const path = require("path")

// Upload file to Supabase Storage
const uploadToSupabase = async (file, bucket = "products") => {
  try {
    // Generate unique filename
    const fileExt = path.extname(file.originalname)
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExt}`
    const filePath = `${bucket}/${fileName}`

    // Upload file
    const storageClient = supabaseAdmin || supabase

    const { data, error } = await storageClient.storage.from("uploads").upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

    if (error) {
      console.error("Supabase upload error:", error)
      throw new Error("Failed to upload file")
    }

    // Get public URL
    const { data: urlData } = storageClient.storage.from("uploads").getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error("File upload error:", error)
    throw error
  }
}

// Delete file from Supabase Storage
const deleteFromSupabase = async (fileUrl) => {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split("/")
    const filePath = urlParts.slice(-2).join("/") // Get last two parts (bucket/filename)

    const storageClient = supabaseAdmin || supabase

    const { error } = await storageClient.storage.from("uploads").remove([filePath])

    if (error) {
      console.error("Supabase delete error:", error)
      throw new Error("Failed to delete file")
    }

    return true
  } catch (error) {
    console.error("File delete error:", error)
    throw error
  }
}

module.exports = {
  uploadToSupabase,
  deleteFromSupabase,
}
