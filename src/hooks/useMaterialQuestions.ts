// src/hooks/useMaterialQuestions.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const fetchQuestionsForMaterial = async (materialId: string) => {
  // fetch questions + choices BUT do not select is_correct column for public
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id, text, "order", points,
      choices ( id, text )
    `)
    .eq('material_id', materialId)
    .order('"order"', { ascending: true });

  if (error) throw error;
  return data;
};

// usage with react-query (v5 style)
export const useMaterialQuestions = (materialId?: string) =>
  useQuery({
    queryKey: ['material', materialId, 'questions'],
    queryFn: () => fetchQuestionsForMaterial(materialId!),
    enabled: !!materialId,
  });