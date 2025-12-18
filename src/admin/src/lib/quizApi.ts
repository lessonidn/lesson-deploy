// src/lib/quizApi.ts
import { supabase } from './supabase'

/* =========================
   1. Categories
   ========================= */
export async function getCategories() {
  return supabase
    .from('categories')
    .select('id, name, slug')
    .eq('is_deleted', false)
    .order('name')
}

export async function createCategory(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, '-')

  // cek apakah sudah ada slug yang sama tapi soft deleted
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
      .update({ is_deleted: false, name })
      .eq('id', data[0].id)
  }

  // kalau belum ada, insert baru
  return supabase.from('categories').insert([
    { name, slug, is_deleted: false },
  ])
}

export async function updateCategory(id: string, name: string) {
  return supabase.from('categories')
    .update({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    })
    .eq('id', id)
}

export async function softDeleteCategory(id: string) {
  return supabase.from('categories')
    .update({ is_deleted: true })
    .eq('id', id)
}

/* =========================
   2. Sub Categories
   ========================= */
export async function getSubCategories(categoryId?: string) {
  let query = supabase
    .from('sub_categories')
    .select('id, name, slug, category_id, categories ( id, name )')
    .eq('is_deleted', false)
    .order('name')

  if (categoryId) query = query.eq('category_id', categoryId)
  return query
}

export async function createSubCategory(name: string, categoryId: string) {
  return supabase.from('sub_categories').insert([
    {
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      category_id: categoryId,
      is_deleted: false,
    },
  ])
}

export async function updateSubCategory(id: string, name: string) {
  return supabase.from('sub_categories')
    .update({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    })
    .eq('id', id)
}

export async function softDeleteSubCategory(id: string) {
  return supabase.from('sub_categories')
    .update({ is_deleted: true })
    .eq('id', id)
}

/* =========================
   3. Exam Sets
   ========================= */
export async function getExamSets(subCategoryId?: string) {
  let query = supabase
    .from('exam_sets')
    .select('id, title, sub_category_id, sub_categories ( id, name )')
    .eq('is_deleted', false)
    .order('title')

  if (subCategoryId) query = query.eq('sub_category_id', subCategoryId)
  return query
}

export async function createExamSet(title: string, subCategoryId: string) {
  return supabase.from('exam_sets').insert([
    {
      title,
      sub_category_id: subCategoryId,
      is_deleted: false,
    },
  ])
}

export async function updateExamSet(id: string, title: string) {
  return supabase.from('exam_sets')
    .update({ title })
    .eq('id', id)
}

export async function softDeleteExamSet(id: string) {
  return supabase.from('exam_sets')
    .update({ is_deleted: true })
    .eq('id', id)
}

/* =========================
   4. Questions
   ========================= */
export async function getQuestions(examSetId?: string) {
  let query = supabase
    .from('questions')
    .select('id, text, exam_set_id, exam_sets ( id, title )')
    .order('id')

  if (examSetId) query = query.eq('exam_set_id', examSetId)
  return query
}

export async function createQuestion(text: string, examSetId: string) {
  return supabase.from('questions').insert([
    { text, exam_set_id: examSetId },
  ])
}

export async function updateQuestion(id: string, text: string) {
  return supabase.from('questions')
    .update({ text })
    .eq('id', id)
}

export async function deleteQuestion(id: string) {
  return supabase.from('questions')
    .delete()
    .eq('id', id)
}

/* =========================
   5. Choices
   ========================= */
export async function getChoices(questionId: string) {
  return supabase
    .from('choices')
    .select('id, text, is_correct, question_id')
    .eq('question_id', questionId)
    .order('id')
}

export async function createChoice(questionId: string, text: string, isCorrect: boolean) {
  return supabase.from('choices').insert([
    { question_id: questionId, text, is_correct: isCorrect },
  ])
}

export async function updateChoice(id: string, text: string, isCorrect: boolean) {
  return supabase.from('choices')
    .update({ text, is_correct: isCorrect })
    .eq('id', id)
}

export async function deleteChoice(id: string) {
  return supabase.from('choices')
    .delete()
    .eq('id', id)
}