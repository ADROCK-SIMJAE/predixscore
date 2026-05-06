"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapExpert } from "@/lib/supabase/mappers";
import { qk } from "./queryKeys";

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

export function useExpert(name: string | null) {
  return useQuery({
    queryKey: qk.expert(name ?? ""),
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
