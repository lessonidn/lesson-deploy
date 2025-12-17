// src/lib/submitAttempt.ts
import { supabase } from './supabaseClient';

export async function submitAttempt(userId: string | null, materialId: string, answers: {question_id:string, choice_id:string}[]) {
  const { data, error } = await supabase.rpc('submit_attempt', {
    p_user_id: userId,
    p_material_id: materialId,
    p_answers: JSON.stringify(answers)
  });

  if (error) throw error;
  return data; // { attempt_id, score, total, per_question }
}
