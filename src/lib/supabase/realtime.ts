"use client";

import { useEffect } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./client";

/**
 * Postgres 변경 이벤트를 구독하는 React 훅.
 * - schema/table/filter 가 바뀌면 자동으로 재구독
 * - onChange 의 stale closure 를 피하려면 useCallback 으로 감싸 전달
 */
export function useRealtimeChannel(opts: {
  channel: string;
  table: string;
  schema?: string;
  filter?: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  onChange: (payload: any) => void;
  enabled?: boolean;
}) {
  const { channel, table, schema = "public", filter, event = "*", onChange, enabled = true } = opts;

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabase();
    let ch: RealtimeChannel | null = null;
    try {
      ch = supabase
        .channel(channel)
        .on(
          "postgres_changes" as any,
          { event, schema, table, ...(filter ? { filter } : {}) },
          (payload) => onChange(payload),
        )
        .subscribe();
    } catch {
      // noop
    }
    return () => {
      if (ch) supabase.removeChannel(ch).catch(() => {});
    };
  }, [channel, table, schema, filter, event, enabled, onChange]);
}
