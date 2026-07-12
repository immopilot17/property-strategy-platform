import { createClient } from "@/lib/supabase/server";

export async function requirePaymentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function appUrl(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
}
