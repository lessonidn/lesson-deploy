// src/lib/quizApi.ts
import { supabase } from '../../../lib/supabase'

/* =========================
   1. Categories
   ========================= */
/* ================= GET ================= */
export async function getCategories() {
  return supabase
    .from('categories')
    .select(`
      id,
      name,
      slug,
      description,
      banner_image,
      is_deleted,
      is_published,
      order_index
    `)
    .eq('is_deleted', false)
    .order('order_index', { ascending: true })
}

/* ================= CREATE ================= */
type CreateCategoryPayload = {
  name: string
}

export async function createCategory(payload: CreateCategoryPayload) {
  const slug = slugify(payload.name)

  // cek apakah slug pernah ada tapi soft deleted
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .eq('is_deleted', true)
    .limit(1)

  if (data && data.length > 0) {
    // restore record lama
    return supabase
      .from('categories')
      .update({
        name: payload.name,
        slug,
        is_deleted: false,
        is_published: true,
      })
      .eq('id', data[0].id)
  }

  // insert baru
  return supabase.from('categories').insert([
    {
      name: payload.name,
      slug,
      is_deleted: false,
      is_published: true,
    },
  ])
}

/* ================= UPDATE ================= */
type UpdateCategoryPayload = {
  name?: string
  is_published?: boolean
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
) {
  const updateData: Record<string, unknown> = {}

  if (payload.name !== undefined) {
    updateData.name = payload.name
    updateData.slug = slugify(payload.name)
  }

  if (payload.is_published !== undefined) {
    updateData.is_published = payload.is_published
  }

  return supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
}

/* ================= SOFT DELETE ================= */
export async function softDeleteCategory(id: string) {
  return supabase
    .from('categories')
    .update({
      is_deleted: true,
      is_published: false,
    })
    .eq('id', id)
}

/* ================= HELPER ================= */
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

/* =========================
   2. Sub Categories
   ========================= */
// Ambil sub kategori, bisa difilter berdasarkan categoryId (MAPEL)
export async function getSubCategories(categoryId?: string) {
  let query = supabase
    .from('sub_categories')
    .select(`
      id,
      name,
      slug,
      category_id,
      categories:categories!sub_categories_category_id_fkey ( id, name )
    `)
    .eq('is_deleted', false)
    .order('name')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  return query
}

export async function createSubCategory(payload: { name: string; category_id: string }) {
  return supabase.from('sub_categories').insert([
    {
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
      category_id: payload.category_id,
      is_deleted: false,
    },
  ])
}

export async function updateSubCategory(
  id: string,
  payload: { name?: string; category_id?: string }
) {
  const updateData: { name?: string; category_id?: string } = {}

  if (payload.name !== undefined) {
    updateData.name = payload.name
  }
  if (payload.category_id !== undefined) {
    updateData.category_id = payload.category_id
  }

  return supabase
    .from('sub_categories')
    .update(updateData)
    .eq('id', id)
}

export async function softDeleteSubCategory(id: string) {
  return supabase.from('sub_categories').update({ is_deleted: true }).eq('id', id)
}

/* =========================
   3. Exam Sets
   ========================= */
  export async function getExamSets(subCategoryId?: string) {
    let query = supabase
      .from('exam_sets')
      .select(`
        id,
        title,
        sub_category_id,
        duration_minutes,
        is_published,
        is_member_only,
        sub_categories (
          id,
          name,
          categories ( id, name )
        )
      `)
      .eq('is_deleted', false)
      .order('title')

    if (subCategoryId) query = query.eq('sub_category_id', subCategoryId)

    const { data, error } = await query
    if (error) return { data: null, error }

    // ✅ tipe data
    type Category = {
      id: string
      name: string
    }

    type SubCategory = {
      id: string
      name: string
      categories?: Category | Category[] | null
    }

    type QuizRecord = {
      id: string
      title: string
      sub_category_id: string
      duration_minutes: number
      is_published: boolean
      is_member_only: boolean
      sub_categories?: SubCategory | SubCategory[]
    }

    // ✅ normalisasi dengan tipe QuizRecord
    const normalized = (data ?? []).map((r: QuizRecord) => {
      const sc = Array.isArray(r.sub_categories) ? r.sub_categories[0] : r.sub_categories
      const cat: Category | undefined =
        sc && Array.isArray(sc.categories) ? sc.categories[0] : sc?.categories as Category | undefined

      return {
        id: r.id,
        title: r.title,
        sub_category_id: r.sub_category_id,
        duration_minutes: r.duration_minutes,
        is_published: r.is_published,
        is_member_only: r.is_member_only,
        sub_categories: sc
          ? {
              id: sc.id,
              name: sc.name,
              categories: cat ? { id: cat.id, name: cat.name } : undefined,
            }
          : undefined,
      }
    })

    return { data: normalized, error: null }
  }

  export async function createExamSet(payload: {
    title: string
    sub_category_id: string
    duration_minutes?: number
    is_member_only?: boolean
  }) {
    return supabase.from('exam_sets').insert([
      {
        title: payload.title,
        sub_category_id: payload.sub_category_id,
        duration_minutes: payload.duration_minutes ?? 30,
        is_deleted: false,
        is_published: false,
        is_member_only: payload.is_member_only ?? false, // ✅ default false, bisa override
      },
    ])
  }

  export type UpdateExamSetPayload = {
    title?: string
    sub_category_id?: string
    duration_minutes?: number
    is_member_only?: boolean // ✅ resmi
    is_published?: boolean   // ✅ tambahkan agar bisa toggle publish
  }

  export async function updateExamSet(
    id: string,
    payload: UpdateExamSetPayload
  ) {
    return supabase
      .from('exam_sets')
      .update(payload)
      .eq('id', id)
  }

  export async function softDeleteExamSet(id: string) {
    return supabase
      .from('exam_sets')
      .update({ is_deleted: true })
      .eq('id', id)
  }

export async function getAdminExamSets() {
  return supabase
    .from('exam_sets')
    .select(`
      id,
      title,
      sub_category_id,
      duration_minutes,
      is_published,
      is_member_only,
      is_deleted,
      sub_categories (
        id,
        name,
        categories (
          id,
          name
        )
      )
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
}


/* =========================
   4. Questions
   ========================= */
export async function getQuestions(examSetId?: string) {
  let query = supabase
    .from('questions_with_exam')
    .select('id, text, exam_set_id, exam_title')
    .order('id')

  if (examSetId) query = query.eq('exam_set_id', examSetId)
  return query
}

type QuestionRow = { id: string }

export async function getQuestionsCount() {
  const pageSize = 1000
  const allData: QuestionRow[] = []
  let from = 0
  let to = pageSize - 1
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('questions')
      .select('id')
      .range(from, to)

    if (error) return { count: 0, error }

    allData.push(...(data ?? []))

    if (!data || data.length < pageSize) {
      hasMore = false
    } else {
      from += pageSize
      to += pageSize
    }
  }

  return { count: allData.length, error: null }
}


// Tambah question baru
export async function createQuestion(
  text: string,
  examSetId: string,
  imagePaths: string[]
) {
  return supabase
    .from('questions')
    .insert({
      text,
      exam_set_id: examSetId,
      image_paths: Array.isArray(imagePaths) ? imagePaths : [],
    })
}

// Update question (text + exam_set_id)
export async function updateQuestion(
  id: string,
  text: string,
  examSetId: string,
  imagePaths: string[]
) {
  return supabase
    .from('questions')
    .update({
      text,
      exam_set_id: examSetId,
      image_paths: Array.isArray(imagePaths) ? imagePaths : [],
    })
    .eq('id', id)
}

// Hapus question
export async function deleteQuestion(id: string) {
  return supabase.from('questions').delete().eq('id', id)
}


/* =========================
   5. Choices
   ========================= */
export async function getChoices(questionId: string) {
  return supabase
    .from('choices')
    .select('id, text, is_correct, question_id, explanation')
    .eq('question_id', questionId)
    .order('id')
}

export async function createChoice(questionId: string, text: string, isCorrect: boolean, explanation?: string) {
  return supabase
    .from('choices')
    .insert([{ question_id: questionId, text, is_correct: isCorrect, explanation }])
}

export async function updateChoice(id: string, text: string, isCorrect: boolean, explanation?: string) {
  return supabase
    .from('choices')
    .update({ text, is_correct: isCorrect, explanation })
    .eq('id', id)
}

export async function deleteChoice(id: string) {
  return supabase.from('choices')
    .delete()
    .eq('id', id)
}

// ================= PUBLISH / UNPUBLISH =================
export async function togglePublishExamSet(
  table: 'exam_sets' | 'categories',
  id: string,
  isPublished: boolean
) {
  return supabase
    .from(table)
    .update({ is_published: isPublished })
    .eq('id', id)
}

// ================= DRAG & DROP CATEGORIES =================
export async function reorderCategories(
  updates: { id: string; order_index: number }[]
) {
  const promises = updates.map(u =>
    supabase
      .from('categories')
      .update({ order_index: u.order_index })
      .eq('id', u.id)
  )

  return Promise.all(promises)
}

export async function isImageUsedByOtherQuestions(
  imageUrl: string,
  excludeQuestionId?: string
): Promise<boolean> {
  let query = supabase
    .from('questions')
    .select('id, text')

  if (excludeQuestionId) {
    query = query.neq('id', excludeQuestionId)
  }

  const { data, error } = await query

  if (error || !data) return false

  return data.some(q => q.text.includes(imageUrl))
}