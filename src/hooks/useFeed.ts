"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { mapFeedItem } from "@/lib/supabase/mappers";
import { qk } from "./queryKeys";

export function useFeed() {
  return useQuery({
    queryKey: qk.feed,
    queryFn: async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("feed_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapFeedItem);
    },
  });
}
