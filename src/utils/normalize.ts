/**
 * Normalisasi relasi Supabase:
 * - object  -> [object]
 * - array   -> array
 * - null    -> []
 */
export function normalizeArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
