import { supabase } from '../../../lib/supabase'

/**
 * Hapus file dari Supabase Storage berdasarkan URL public
 */
export async function deleteImageFromSupabase(url: string) {
  try {
    // URL public: https://<project>.supabase.co/storage/v1/object/public/questions/images/<filename>.webp
    const u = new URL(url)
    const path = u.pathname.replace('/storage/v1/object/public/questions/', '')
    if (!path) throw new Error('URL tidak valid')

    const { error } = await supabase.storage
      .from('questions')
      .remove([path])

    if (error) throw error
    console.log('File dihapus:', path)
    return true
  } catch (err) {
    console.error('Gagal hapus file:', err)
    return false
  }
}