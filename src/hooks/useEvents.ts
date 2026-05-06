"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapEvent } from "@/lib/supabase/mappers";
import { qk } from "./queryKeys";

export function useEvents() {
  return useQuery({
    queryKey: qk.events,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapEvent);
    },
  });
}
