"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";

export function SignOutButton() {
  const router = useRouter();

  if (!hasSupabaseEnv()) return null;

  async function onSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      className="tracking-[0.18em] text-muted uppercase transition hover:text-foreground"
    >
      Sign out
    </button>
  );
}
