"use client";

import { getSupabase } from "./client";

export interface SignUpInput {
  email: string;
  password: string;
  handle: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpResult {
  user: import("@supabase/supabase-js").User | null;
  session: import("@supabase/supabase-js").Session | null;
  needsEmailConfirmation: boolean;
}

export async function signUp({ email, password, handle }: SignUpInput): Promise<SignUpResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { handle } },
  });
  if (error) throw error;
  // 이메일 확인이 ON이면 user는 있지만 session이 null
  const needsEmailConfirmation = !!data.user && !data.session;
  return { user: data.user, session: data.session, needsEmailConfirmation };
}

export async function signIn({ email, password }: SignInInput) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}
