import { AdminPage } from "@/components/admin";
import { invitation } from "@/content/invitation";
import { authDisplayName } from "@/lib/auth-user";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRoutePage() {
  let displayName = invitation.couple.displayNames;

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    displayName = authDisplayName(user?.user_metadata, displayName);
  }

  return <AdminPage displayName={displayName} />;
}
