import imageCompression from 'browser-image-compression'
import { supabase } from '../../../lib/supabase'

export async function uploadImageToSupabase(file: File) {
  // 1. Compress & convert ke WebP
  const options = {
    maxSizeMB: 0.5,        // target max 500KB
    maxWidthOrHeight: 800, // resize max 800px
    fileType: 'image/webp' // convert ke WebP
  }
  const compressedFile = await imageCompression(file, options)

  // 2. Upload ke Supabase Storage bucket "questions"
  const fileName = `images/${Date.now()}.webp`
  const { error } = await supabase.storage
    .from('questions')
    .upload(fileName, compressedFile, { upsert: true }) // ✅ pakai upsert

  if (error) throw error

  // 3. Ambil public URL
  const { data: urlData } = supabase.storage
    .from('questions')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}