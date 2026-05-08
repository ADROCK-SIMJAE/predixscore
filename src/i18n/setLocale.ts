"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isValidLocale, LOCALE_COOKIE } from "./config";

export async function setLocale(formData: FormData) {
  const next = formData.get("locale");
  if (!isValidLocale(next)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, next, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
