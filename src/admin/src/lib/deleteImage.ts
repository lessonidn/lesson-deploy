import { supabase } from '../../../lib/supabase'

type DeleteImageResult =
  | { ok: true }
  | { ok: false; usedBy: { id: string; preview: string }[] }

/**
 * Delete image safely.
 * Jika masih dipakai soal → return daftar soal
 */
export async function deleteImageFromSupabase(
  imagePath: string
): Promise<DeleteImageResult> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('id, text')
      .contains('image_paths', [imagePath])

    if (error) {
      console.error('Error cek pemakaian gambar:', error)
      return { ok: false, usedBy: [] }
    }

    if (data && data.length > 0) {
      return {
        ok: false,
        usedBy: data.map(q => ({
          id: q.id,
          preview: q.text
            .replace(/<[^>]+>/g, '') // strip HTML
            .slice(0, 80) + '...',
        })),
      }
    }

    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([imagePath])

    if (deleteError) {
      console.error('Gagal hapus file:', deleteError)
      return { ok: false, usedBy: [] }
    }

    return { ok: true }
  } catch (err) {
    console.error('Delete image error:', err)
    return { ok: false, usedBy: [] }
  }
}