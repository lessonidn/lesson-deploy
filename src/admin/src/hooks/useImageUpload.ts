import { supabase } from '../../../lib/supabase'
import { convertToWebP } from '../utils/convertToWebP'

export async function uploadImageAsWebP(
  file: File,
  folder: 'questions' | 'categories' | 'banners' | 'misc'
): Promise<string> {
  // Validasi
  if (!file.type.startsWith('image/')) {
    throw new Error('File harus berupa gambar')
  }

  // Convert → WebP
  const webpBlob = await convertToWebP(file, 0.8)

  const filePath = `${folder}/${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage
    .from('media')
    .upload(filePath, webpBlob, {
      contentType: 'image/webp',
      upsert: false
    })

  if (error) {
    throw error
  }

  // RETURN PATH (bukan URL)
  return filePath
}
