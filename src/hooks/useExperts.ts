"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapExpert } from "@/lib/supabase/mappers";
import { qk } from "./queryKeys";

// 전체 전문가 목록 조회
export function useExperts() {
  return useQuery({
    queryKey: qk.experts,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .order("rank", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapExpert);
    },
  });
}

// id 로 단일 전문가 조회
export function useExpert(id: number | null | undefined) {
  return useQuery({
    queryKey: qk.expert(id ?? -1),
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapExpert(data) : null;
    },
  });
}

// name 으로 전문가 lookup (legacy 화면 호환용)
export function useExpertByName(name: string | null | undefined) {
  return useQuery({
    queryKey: qk.expert(`name:${name ?? ""}`),
    enabled: !!name,
    queryFn: async () => {
      if (!name) return null;
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("experts")
        .select("*")
        .eq("name", name)
        .maybeSingle();
      if (error) throw error;
      return data ? mapExpert(data) : null;
    },
  });
}
